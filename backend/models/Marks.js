const mongoose = require('mongoose');

const marksSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  assessmentType: { type: String, enum: ['AT 1', 'AT 2', 'AT 3', 'AT 4', 'MID 1', 'MID 2', 'MID 3', 'Others'], required: true },
  score: { type: Number, required: true },
  maxScore: { type: Number, required: true },
  subject: { type: String, required: true },
  semester: { type: String, enum: ['sem1', 'sem2'], required: true },
});

module.exports = mongoose.model('Marks', marksSchema);
