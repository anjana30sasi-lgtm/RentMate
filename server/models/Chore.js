const mongoose = require('mongoose');
module.exports = mongoose.model('Chore', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, title: { type: String, required: true }, description: String,
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, dueDate: Date, status: { type: String, enum: ['Pending', 'Completed'], default: 'Pending' }
}, { timestamps: true }));
