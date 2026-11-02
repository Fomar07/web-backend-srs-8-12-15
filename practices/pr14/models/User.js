const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  role: { type: String, enum: ['client', 'trainer'], default: 'client' }
}, { timestamps: true });
module.exports = mongoose.model('User', schema);
