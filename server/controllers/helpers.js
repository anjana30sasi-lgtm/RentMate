const Notification = require('../models/Notification');
const House = require('../models/House');
exports.getHouse = async (userId) => House.findOne({ members: userId }).populate('members', 'name email');
exports.isAdmin = (house, userId) => house.admin.toString() === userId.toString();
const userId = (user) => (user._id || user).toString();
exports.notifyUsers = async (recipients, house, message, type, dedupeKey, actor) => {
  const userIds = [...new Set(recipients.map(userId))];
  await Promise.all(userIds.map((user) => Notification.updateOne({ user, dedupeKey }, { $setOnInsert: { user, actor, house: house._id, message, type, dedupeKey } }, { upsert: true })));
};
