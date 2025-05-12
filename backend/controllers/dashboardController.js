const Student = require('../models/Student');
const Quiz = require('../models/Quiz');
const Notification = require('../models/Notification');
const Subject = require('../models/Subject');
const Report = require('../models/Report');

// GET /api/admin/dashboard/stats
exports.getStats = async (req, res) => {
  try {
    // Count students
    const students = await Student.countDocuments();
    // Count quizzes/assignments
    const quizzes = await Quiz.countDocuments();
    // Count notifications
    const notifications = await Notification.countDocuments();
    // Count subjects
    const subjects = await Subject.countDocuments();
    // Count reports
    const reports = await Report.countDocuments();

    res.json({ students, quizzes, notifications, subjects, reports });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
