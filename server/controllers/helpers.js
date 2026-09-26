const Notification = require('../models/Notification');
const House = require('../models/House');
exports.getHouse = async (userId) => House.findOne({ members: userId }).populate('members', 'name email');
exports.isAdmin = (house, userId) => house.admin.toString() === userId.toString();
exports.notify = async (house, message, type, excludedUserId) => {
  const recipients = house.members.filter((member) => member.toString() !== String(excludedUserId));
  if (recipients.length) await Notification.insertMany(recipients.map((user) => ({ user, house: house._id, message, type })));
};
