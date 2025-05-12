const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const auth = require('../middleware/auth');

// Create subject (Admin only)
router.post('/', auth('admin'), subjectController.createSubject);
// Update subject (Admin only)
router.put('/:id', auth('admin'), subjectController.updateSubject);
// Delete subject (Admin only)
router.delete('/:id', auth('admin'), subjectController.deleteSubject);
// Get subjects (Admin/Student)
router.get('/', auth(['admin', 'student']), subjectController.getSubjects);

module.exports = router;
