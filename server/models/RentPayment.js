const mongoose = require('mongoose');
module.exports = mongoose.model('RentPayment', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  month: { type: String, required: true }, amount: { type: Number, required: true }, status: { type: String, enum: ['Paid', 'Pending', 'Overdue'], default: 'Pending' }, paidAt: Date
}, { timestamps: true }));
