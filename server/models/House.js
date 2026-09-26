const mongoose = require('mongoose');
module.exports = mongoose.model('House', new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  joinCode: { type: String, required: true, unique: true },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  monthlyRent: { type: Number, default: 0 },
  rentDueDay: { type: Number, default: 5, min: 1, max: 31 }
}, { timestamps: true }));
