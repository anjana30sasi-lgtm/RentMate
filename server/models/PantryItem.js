const mongoose = require('mongoose');
module.exports = mongoose.model('PantryItem', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true, index: true }, name: { type: String, required: true, trim: true }, category: { type: String, default: 'Other', trim: true }, quantity: { type: Number, required: true, min: 0 }, unit: { type: String, required: true, trim: true }, purchaseDate: Date, expiryDate: Date, lowStockThreshold: { type: Number, default: 0, min: 0 }, purchasedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, notes: { type: String, default: '' }, createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true }));
