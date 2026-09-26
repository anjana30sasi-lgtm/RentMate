const mongoose = require('mongoose');
module.exports = mongoose.model('MaintenanceRequest', new mongoose.Schema({
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', required: true }, title: { type: String, required: true }, location: String, description: String,
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' }, status: { type: String, enum: ['Reported', 'Assigned', 'In Progress', 'Resolved'], default: 'Reported' },
  reportedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true }));
