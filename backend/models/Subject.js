const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  year: { type: String, enum: ['E-1', 'E-2', 'E-3', 'E-4'], required: true },
  semester: { type: String, enum: ['1', '2'], required: true },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Subject', subjectSchema);
