const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  house: { type: mongoose.Schema.Types.ObjectId, ref: 'House', default: null },
  avatar: { type: String, default: '' }
}, { timestamps: true });
userSchema.pre('save', async function save(next) { if (!this.isModified('password')) return next(); this.password = await bcrypt.hash(this.password, 12); next(); });
userSchema.methods.comparePassword = function comparePassword(password) { return bcrypt.compare(password, this.password); };
module.exports = mongoose.model('User', userSchema);
