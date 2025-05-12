const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const auth = require('../middleware/auth');

// Admin: CRUD students
router.post('/', auth('admin'), studentController.createStudent);
router.get('/', auth(['admin']), studentController.getStudents);
router.get('/my', auth(['admin', 'student']), studentController.getMyProfile);
// Student updates their semester
router.put('/semester', auth(['student']), studentController.updateSemester);
router.get('/:studentId', auth(['admin', 'student']), studentController.getStudentProfile);
router.put('/:id', auth('admin'), studentController.updateStudent);

// Bulk delete students (must be before :id route!)
router.delete('/bulk-delete', auth('admin'), studentController.bulkDeleteStudents);

// Single student delete
router.delete('/:id', auth('admin'), studentController.deleteStudent);

module.exports = router;
