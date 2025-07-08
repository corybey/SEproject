const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['job_seeker', 'employer'], required: true },
  resumeRef: { type: String }, // resume file path or GridFS link
  createdAt: { type: Date, default: Date.now }
});

// Export the model
const User = mongoose.model('User', userSchema);
module.exports = User;

