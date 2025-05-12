const express = require('express');
const router = express.Router();
const marksController = require('../controllers/marksController');
const auth = require('../middleware/auth');

// Create marks (Admin only)
router.post('/', auth('admin'), marksController.createMarks);
// Get marks for a student (Admin or Student)
router.get('/:studentId', auth(['admin', 'student']), marksController.getStudentMarks);
// Get marks for a section (Admin only, with filters)
router.get('/section/filter', auth('admin'), marksController.getSectionMarks);
// Update marks by ID (Admin only)
router.put('/:id', auth('admin'), marksController.updateMarks);
// Delete marks by ID (Admin only)
router.delete('/:id', auth('admin'), marksController.deleteMarks);
// Bulk delete marks by IDs (Admin only)
router.post('/bulk-delete', auth('admin'), marksController.bulkDeleteMarks);

module.exports = router;
