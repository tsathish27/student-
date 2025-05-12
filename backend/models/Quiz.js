const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema({
  questionText: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctOption: { type: Number, required: true }, // index of correct option
  marks: { type: Number, required: true }
});

const quizSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  section: { type: String, enum: [
    'CSE-01', 'CSE-02', 'CSE-03', 'CSE-04', 'CSE-05', 'CSE-06'], required: true },
  year: { type: String, enum: ['E1', 'E2', 'E3', 'E4'], required: true },
  semester: { type: String, enum: ['sem1', 'sem2'], required: true },
  questions: [questionSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  deadline: { type: Date },
});

module.exports = mongoose.model('Quiz', quizSchema);
