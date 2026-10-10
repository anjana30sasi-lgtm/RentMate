const PantryItem = require('../models/PantryItem');
const { getHouse, isAdmin, notifyUsers } = require('./helpers');

const memberId = (member) => (member._id || member).toString();

const cleanDates = (data) => {
  const result = { ...data };
  if (result.purchaseDate === '') result.purchaseDate = null;
  if (result.expiryDate === '') result.expiryDate = null;
  return result;
};

const warning = (item) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 7);
  const expiry = item.expiryDate ? new Date(item.expiryDate) : null;
  const isOutOfStock = item.quantity === 0;
  const isLowStock = !isOutOfStock && item.quantity < item.lowStockThreshold;
  return {
    ...item.toObject(),
    outOfStock: isOutOfStock,
    lowStock: isLowStock,
    status: isOutOfStock ? 'Out of Stock' : (isLowStock ? 'Low Stock' : 'Normal'),
    expired: Boolean(expiry && expiry < today),
    expiringSoon: Boolean(expiry && expiry >= today && expiry <= soon)
  };
};

const validate = (body) => {
  if (!body.name?.trim() || body.quantity === undefined || !body.unit?.trim()) throw new Error('Name, quantity, and unit are required.');
  if (!Number.isFinite(Number(body.quantity)) || Number(body.quantity) < 0 || !Number.isFinite(Number(body.lowStockThreshold ?? 0)) || Number(body.lowStockThreshold ?? 0) < 0) throw new Error('Quantities must be zero or greater.');
  if (body.purchaseDate && body.expiryDate && new Date(body.expiryDate) < new Date(body.purchaseDate)) throw new Error('Expiry date cannot be before purchase date.');
};

const itemForHouse = async (id, houseId) => PantryItem.findOne({ _id: id, house: houseId });

exports.list = async (req, res) => {
  const house = await getHouse(req.userId);
  if (!house) return res.json({ items: [], summary: { total: 0, lowStock: 0, outOfStock: 0, expiringSoon: 0 } });
  const filter = { house: house._id };
  if (req.query.category) filter.category = req.query.category;
  if (req.query.search) filter.name = { $regex: req.query.search, $options: 'i' };
  const items = (await PantryItem.find(filter).populate('purchasedBy createdBy', 'name email').sort('expiryDate name')).map(warning);
  res.json({
    items,
    summary: {
      total: items.length,
      lowStock: items.filter((item) => item.lowStock).length,
      outOfStock: items.filter((item) => item.outOfStock).length,
      expiringSoon: items.filter((item) => item.expiringSoon || item.expired).length
    }
  });
};

exports.create = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    if (!house) return res.status(400).json({ message: 'Join a house first.' });
    const payload = cleanDates(req.body);
    validate(payload);
    const purchasedBy = payload.purchasedBy || req.userId;
    if (!house.members.some((member) => memberId(member) === purchasedBy.toString())) {
      return res.status(400).json({ message: 'Purchased-by member must belong to this house.' });
    }
    const item = await PantryItem.create({ ...payload, house: house._id, purchasedBy, createdBy: req.userId });
    await notifyUsers(house.members.filter((member) => memberId(member) !== req.userId), house, `New pantry item added: ${item.name} (${item.quantity} ${item.unit}).`, 'Pantry', `pantry:${item._id}`, req.userId);
    res.status(201).json(warning(await item.populate('purchasedBy createdBy', 'name email')));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    const item = await itemForHouse(req.params.id, house?._id);
    if (!item) return res.status(404).json({ message: 'Pantry item not found.' });
    if (!isAdmin(house, req.userId) && item.createdBy.toString() !== req.userId) {
      return res.status(403).json({ message: 'You are not allowed to edit this item.' });
    }
    const payload = cleanDates(req.body);
    validate({ ...item.toObject(), ...payload });
    Object.assign(item, payload);
    await item.save();
    res.json(warning(await item.populate('purchasedBy createdBy', 'name email')));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.adjust = async (req, res) => {
  try {
    const house = await getHouse(req.userId);
    const item = await itemForHouse(req.params.id, house?._id);
    const change = Number(req.body.change);
    if (!item) return res.status(404).json({ message: 'Pantry item not found.' });
    if (!Number.isFinite(change) || item.quantity + change < 0) return res.status(400).json({ message: 'Quantity adjustment is invalid.' });
    item.quantity += change;
    await item.save();
    if (item.quantity < item.lowStockThreshold || item.quantity === 0) {
      const alertType = item.quantity === 0 ? 'Out of stock' : 'Low stock';
      await notifyUsers(house.members, house, `${alertType} alert: ${item.name} has only ${item.quantity} ${item.unit} left.`, 'Pantry', `pantry:${item._id}:low:${item.quantity}`, req.userId);
    }
    await item.populate('purchasedBy createdBy', 'name email');
    res.json(warning(item));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.remove = async (req, res) => {
  const house = await getHouse(req.userId);
  const item = await itemForHouse(req.params.id, house?._id);
  if (!item) return res.status(404).json({ message: 'Pantry item not found.' });
  if (!isAdmin(house, req.userId) && item.createdBy.toString() !== req.userId) {
    return res.status(403).json({ message: 'You are not allowed to delete this item.' });
  }
  await item.deleteOne();
  res.json({ message: 'Pantry item deleted.' });
};
