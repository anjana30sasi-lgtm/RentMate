const mongoose = require('mongoose');
module.exports = mongoose.model('Expense', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true },
  title: { type: String, required: true }, category: { type: String, default: 'Other' },
  amount: { type: Number, required: true, min: 1 }, paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  splitBetween: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], date: { type: Date, default: Date.now }, notes: String
}, { timestamps: true }));
