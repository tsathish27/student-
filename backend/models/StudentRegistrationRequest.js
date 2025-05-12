const mongoose = require('mongoose');

const StudentRegistrationRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  section: { type: String, required: true },
  year: { type: String, required: true },
  rollNo: { type: String, required: true },
  idNumber: { type: String, required: true },
  phone: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: { type: String },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StudentRegistrationRequest', StudentRegistrationRequestSchema);
