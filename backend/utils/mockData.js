const mongoose = require('mongoose');

const mockReports = [
  {
    _id: new mongoose.Types.ObjectId(),
    title: 'Attendance Report',
    type: 'attendance',
    data: { present: 22, total: 25, percent: 88 },
    createdAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    title: 'Marks Report',
    type: 'marks',
    data: { subject: 'Maths', score: 88, max: 100 },
    createdAt: new Date(),
  }
];

const mockNotifications = [
  {
    _id: new mongoose.Types.ObjectId(),
    message: 'Semester exams start next week!',
    type: 'info',
    target: 'all',
    createdAt: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    message: 'Project submission deadline extended.',
    type: 'success',
    target: 'all',
    createdAt: new Date(),
  }
];

const mockAuditLogs = [
  {
    _id: new mongoose.Types.ObjectId(),
    user: 'admin@example.com',
    action: 'login',
    details: 'Admin logged in',
    date: new Date(),
  },
  {
    _id: new mongoose.Types.ObjectId(),
    user: 'student@example.com',
    action: 'mark_attendance',
    details: 'Attendance marked for 2025-04-29',
    date: new Date(),
  }
];

module.exports = { mockReports, mockNotifications, mockAuditLogs };
