const mongoose = require('mongoose');
const settlementSchema = new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, amount: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' }, sourceExpense: { type: mongoose.Schema.Types.ObjectId, ref: 'Expense' }
}, { timestamps: true });
settlementSchema.pre('validate', function validateDifferentUsers(next) { if (this.from && this.to && this.from.toString() === this.to.toString()) return next(new Error('A settlement cannot have the same payer and recipient.')); next(); });
module.exports = mongoose.model('Settlement', settlementSchema);
