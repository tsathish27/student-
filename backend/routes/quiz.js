const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Admin: Create quiz
router.post('/', auth('admin'), quizController.createQuiz);
// Admin: Update quiz
router.put('/:id', auth('admin'), quizController.updateQuiz);
// Admin: Delete quiz
router.delete('/:id', auth('admin'), quizController.deleteQuiz);
// Get all quizzes (filter by section/year/semester/subject)
router.get('/', auth(['admin', 'student']), quizController.getQuizzes);
// Get quiz attempts for a specific student
router.get('/attempts/:studentId', auth(['admin', 'student']), quizController.getStudentAttempts);
// Get available quizzes for a specific student
router.get('/available/:studentId', auth(['admin', 'student']), quizController.getAvailableQuizzes);
// Get available quizzes for the current student (from JWT)
router.get('/available/me', auth(['student']), quizController.getAvailableQuizzes);
// Student: Get all quizzes for their section/year/semester/subject with status
router.get('/all-with-status/:studentId', auth(['student']), quizController.getAllQuizzesWithStatus);
// Student: Get all quizzes for their section/year/semester/subject with status (current user)
router.get('/all-with-status/me', auth(['student']), quizController.getAllQuizzesWithStatus);
// Student: Submit quiz attempt
router.post('/:id/submit', auth(['student']), quizController.submitQuiz);

// Student: Get quiz review data
router.get('/review/:quizId', auth(['student']), quizController.getQuizReview);

module.exports = router;
