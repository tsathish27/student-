const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const auth = require('../middleware/auth');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

// Bulk import students from Excel (Admin only)
router.post('/students', auth('admin'), upload.single('file'), importController.importStudents);
// Bulk import attendance from Excel (Admin only)
router.post('/attendance', auth('admin'), upload.single('file'), importController.importAttendance);
// Bulk import marks from Excel (Admin only)
router.post('/marks', auth('admin'), upload.single('file'), importController.importMarks);

module.exports = router;
