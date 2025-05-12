const mongoose = require('mongoose');

const answerSchema = new mongoose.Schema({
  questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  selectedOption: { type: Number, required: true }
});

const quizAttemptSchema = new mongoose.Schema({
  quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  answers: [answerSchema],
  score: { type: Number, default: 0 },
  submittedAt: { type: Date, default: Date.now },
  evaluated: { type: Boolean, default: false }
});

module.exports = mongoose.model('QuizAttempt', quizAttemptSchema);
