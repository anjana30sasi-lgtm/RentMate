const mongoose = require('mongoose');
const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, house: { type: mongoose.Schema.Types.ObjectId, ref: 'House' }, message: { type: String, required: true }, type: { type: String, default: 'General' }, read: { type: Boolean, default: false }, dedupeKey: { type: String }
}, { timestamps: true });
notificationSchema.index({ user: 1, dedupeKey: 1 }, { unique: true, partialFilterExpression: { dedupeKey: { $exists: true } } });
module.exports = mongoose.model('Notification', notificationSchema);
