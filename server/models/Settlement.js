const mongoose = require('mongoose');
module.exports = mongoose.model('Settlement', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }, sourceExpense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }
}, { timestamps: true }));
