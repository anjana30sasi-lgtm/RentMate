const Chore = require('../models/Chore');
const { getHouse, isAdmin, notifyUsers } = require('./helpers');

const memberId = (member) => (member._id || member).toString();

const weekKey = (value = new Date()) => {
  const date = new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return `${date.getUTCFullYear()}-W${String(Math.ceil((((date - yearStart) / 86400000) + 1) / 7)).padStart(2, '0')}`;
};

const statusFor = (chore) => chore.status === 'Pending' && chore.dueDate && new Date(chore.dueDate) < new Date().setHours(0, 0, 0, 0) ? 'Overdue' : chore.status;

const validate = (body) => {
  if (!body.title?.trim()) throw new Error('Chore title is required.');
  if (body.dueDate && Number.isNaN(new Date(body.dueDate).getTime())) throw new Error('Provide a valid due date.');
};

exports.list = async (req, res) => {
  const house = await getHouse(req.userId);
  if (!house) return res.json([]);
  const chores = await Chore.find({ house: house._id })
    .sort('dueDate -createdAt')
    .populate('assignedTo createdBy assignmentHistory.user', 'name email');
  await Promise.all(chores.filter((chore) => statusFor(chore) === 'Overdue' && chore.status !== 'Overdue').map((chore) => {
    chore.status = 'Overdue';
    return chore.save();
  }));
  res.json(chores.map((chore) => ({ ...chore.toObject(), status: statusFor(chore) })));
};

exports.create = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    if (!house) return res.status(400).json({ message: 'Join a house first.' });
    validate(req.body);
    if (!req.body.assignedTo || !house.members.some((member) => memberId(member) === req.body.assignedTo)) {
      return res.status(400).json({ message: 'Choose a member of this house.' });
    }
    const dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
    const chore = await Chore.create({
      ...req.body,
      house: house._id,
      createdBy: req.userId,
      dueDate,
      rotationDay: dueDate ? dueDate.getDay() : new Date().getDay(),
      assignmentHistory: [{ user: req.body.assignedTo, dueDate, status: 'Pending' }]
    });
    await notifyUsers([chore.assignedTo], house, `New chore assignment: ${chore.title}`, 'Chore', `chore:${chore._id}`, req.userId);
    await chore.populate('assignedTo createdBy assignmentHistory.user', 'name email');
    res.status(201).json(chore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    const chore = await Chore.findOne({ _id: req.params.id, house: house?._id });
    if (!chore) return res.status(404).json({ message: 'Chore not found.' });
    const assigneeCompleting = req.body.status === 'Completed' && chore.assignedTo.toString() === req.userId;
    if (!assigneeCompleting && !isAdmin(house, req.userId) && chore.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not allowed to edit this chore.' });
    }
    if (req.body.assignedTo && !house.members.some((member) => memberId(member) === req.body.assignedTo)) {
      return res.status(400).json({ message: 'Assignee must belong to this house.' });
    }
    if (assigneeCompleting) {
      chore.status = 'Completed';
      const history = chore.assignmentHistory.at(-1);
      if (history) {
        history.status = 'Completed';
        history.completedAt = new Date();
      }
      await notifyUsers([house.admin], house, `Chore completed: ${chore.title}`, 'Chore', `chore:${chore._id}:completed:${Date.now()}`, req.userId);
    } else {
      ['title', 'description', 'frequency', 'priority', 'dueDate', 'assignedTo'].forEach((field) => {
        if (req.body[field] !== undefined) {
          if (field === 'dueDate') {
            chore.dueDate = req.body.dueDate ? new Date(req.body.dueDate) : null;
            if (chore.dueDate) chore.rotationDay = chore.dueDate.getDay();
          } else {
            chore[field] = req.body[field];
          }
        }
      });
    }
    await chore.save();
    await chore.populate('assignedTo createdBy assignmentHistory.user', 'name email');
    res.json(chore);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  const house = await getHouse(req.userId);
  const chore = await Chore.findOne({ _id: req.params.id, house: house?._id });
  if (!chore) return res.status(404).json({ message: 'Chore not found.' });
  if (!isAdmin(house, req.userId) && chore.createdBy.toString() !== req.userId) {
    return res.status(403).json({ message: 'You are not allowed to delete this chore.' });
  }
  await chore.deleteOne();
  res.json({ message: 'Chore deleted.' });
};

exports.rotate = async (req, res) => {
  const house = await getHouse(req.userId);
  if (!house || !isAdmin(house, req.userId)) return res.status(403).json({ message: 'Only the house admin can rotate assignments.' });
  const currentWeek = weekKey();
  const force = Boolean(req.body?.force || req.query?.force);
  const filter = { house: house._id, frequency: 'Weekly' };
  if (!force) filter.rotationWeek = { $ne: currentWeek };
  const chores = await Chore.find(filter);
  const memberIds = house.members.map(memberId);
  const assigned = [];
  for (const chore of chores) {
    const lastAssignee = chore.assignmentHistory.at(-1)?.user?.toString();
    const eligible = memberIds.length > 1 ? memberIds.filter((id) => id !== lastAssignee) : memberIds;
    const counts = await Chore.aggregate([
      { $match: { house: house._id, 'assignmentHistory.assignedAt': { $gte: new Date(Date.now() - 28 * 86400000) } } },
      { $unwind: '$assignmentHistory' },
      { $match: { 'assignmentHistory.user': { $in: house.members.map((m) => m._id) } } },
      { $group: { _id: '$assignmentHistory.user', count: { $sum: 1 } } }
    ]);
    const countByUser = Object.fromEntries(counts.map((item) => [item._id.toString(), item.count]));
    const next = eligible.sort((left, right) => (countByUser[left] || 0) - (countByUser[right] || 0))[0];
    const dueDate = new Date();
    const dayDiff = ((chore.rotationDay ?? dueDate.getDay()) - dueDate.getDay() + 7) % 7 || 7;
    dueDate.setDate(dueDate.getDate() + dayDiff);
    const updated = await Chore.findByIdAndUpdate(chore._id, {
      $set: { assignedTo: next, dueDate, status: 'Pending', rotationWeek: currentWeek },
      $push: { assignmentHistory: { user: next, dueDate, status: 'Pending' } }
    }, { new: true });
    if (updated) {
      assigned.push(updated);
      await notifyUsers([next], house, `Chore rotated to you: ${chore.title}`, 'Chore', `chore:${chore._id}:rotated:${Date.now()}`, req.userId);
    }
  }
  res.json({
    message: `${assigned.length} chore assignment(s) rotated.`,
    chores: await Promise.all(assigned.map((chore) => chore.populate('assignedTo createdBy assignmentHistory.user', 'name email')))
  });
};

exports.workload = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    if (!house) return res.json([]);
    const counts = await Chore.aggregate([
      { $match: { house: house._id, 'assignmentHistory.assignedAt': { $gte: new Date(Date.now() - 28 * 86400000) } } },
      { $unwind: '$assignmentHistory' },
      { $group: {
        _id: '$assignmentHistory.user',
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ['$assignmentHistory.status', 'Completed'] }, 1, 0] } }
      }}
    ]);
    const countMap = Object.fromEntries(counts.map((c) => [c._id.toString(), { total: c.total, completed: c.completed }]));
    const workload = house.members.map((m) => ({
      user: { _id: m._id, name: m.name, email: m.email },
      assignedCount: countMap[m._id.toString()]?.total || 0,
      completedCount: countMap[m._id.toString()]?.completed || 0
    }));
    res.json(workload);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
