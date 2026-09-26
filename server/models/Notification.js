const mongoose = require('mongoose');
module.exports = mongoose.model('Notification', new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, house: { type: mongoose.Schema.Types.ObjectId, ref: 'House' }, message: { type: String, required: true }, type: { type: String, default: 'General' }, read: { type: Boolean, default: false }
}, { timestamps: true }));
