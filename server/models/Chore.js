const mongoose = require('mongoose');
module.exports = mongoose.model('Chore', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, title: { type: String, required: true }, description: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, dueDate: Date,
  frequency: { type: String, enum: ['Once', 'Weekly'], default: 'Once' }, priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }, rotationWeek: String, rotationDay: { type: Number, min: 0, max: 6 },
  status: { type: String, enum: ['Pending', 'Completed', 'Overdue'], default: 'Pending' }, assignmentHistory: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, assignedAt: { type: Date, default: Date.now }, dueDate: Date, completedAt: Date, status: { type: String, enum: ['Pending', 'Completed', 'Overdue'], default: 'Pending' } }]
}, { timestamps: true }));
