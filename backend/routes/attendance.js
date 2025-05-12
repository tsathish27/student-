const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const auth = require('../middleware/auth');

// Mark attendance (Admin only)
router.post('/', auth('admin'), attendanceController.markAttendance);
// Get attendance by filter (admin view)
router.get('/', auth('admin'), attendanceController.getAttendanceByFilter);
router.get('/existing', attendanceController.getAttendanceByFilter);
// Get attendance summary for a student (all subjects by semester)
router.get('/:studentId/summary', auth(['admin', 'student']), attendanceController.getStudentAttendanceSummary);
// Get attendance summary for a student
router.get('/:studentId', auth(['admin', 'student']), attendanceController.getStudentAttendance);
// Update a single attendance record
router.patch('/:attendanceId', auth('admin'), attendanceController.updateAttendance);
// Delete a single attendance record
router.delete('/:attendanceId', auth('admin'), attendanceController.deleteAttendance);

module.exports = router;
