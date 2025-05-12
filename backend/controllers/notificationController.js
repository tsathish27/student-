const Notification = require('../models/Notification');
const User = require('../models/User');

// Mark all notifications as read for the authenticated user
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    // Update all notifications for this user, their section/year, or all
    const result = await Notification.updateMany({
      $or: [
        { userId },
        { target: 'all' },
        { target: 'section', section: req.user.section },
        { target: 'year', year: req.user.year },
      ],
      read: false
    }, { $set: { read: true } });
    res.json({ message: 'All notifications marked as read', updatedCount: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Mark a notification as read for the authenticated user
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const notificationId = req.params.id;
    // Only allow marking notifications that are for this user, or targeted to their section/year/all
    const notification = await Notification.findOne({
      _id: notificationId,
      $or: [
        { userId },
        { target: 'all' },
        { target: 'section', section: req.user.section },
        { target: 'year', year: req.user.year },
      ]
    });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    notification.read = true;
    await notification.save();
    res.json({ message: 'Notification marked as read', notification });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get notifications for the authenticated student
exports.getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const section = req.user.section || req.user.section;
    const year = req.user.year || req.user.year;
    // Find notifications for this user, their section/year, or broadcast
    const notifications = await Notification.find({
      $or: [
        { userId },
        { target: 'all' },
        { target: 'section', section: req.user.section },
        { target: 'year', year: req.user.year },
      ]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all notifications
exports.getNotifications = async (req, res) => {
  try {
    let notifications = await Notification.find().sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get notifications for a specific student (admin or student access)
exports.getNotificationsForStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    // Only allow admin or the student themselves
    if (req.user.role === 'student' && req.user.studentId !== studentId && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Forbidden: cannot access another student\'s notifications' });
    }
    // Find the student's section
    const student = await require('../models/Student').findById(studentId);
    if (!student) return res.status(404).json({ message: 'Student not found' });
    // Notifications for this student: direct, section, or all
    const notifications = await Notification.find({
      $or: [
        { userId: student.userId },
        { target: 'all' },
        { target: 'section', section: student.section }
      ]
    }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Create/send a notification
const Student = require('../models/Student');
exports.createNotification = async (req, res) => {
  try {
    const { message, type = 'info', target = 'all', year = '', section = '' } = req.body;
    let notifications = [];
    if (target === 'year' && year) {
      const students = await Student.find({ year });
      if (!students.length) {
        return res.status(400).json({ message: `No students found for year ${year}` });
      }
      notifications = await Promise.all(students.map(student => {
        if (!student.userId) throw new Error(`Student ${student._id} missing userId`);
        const notif = new Notification({ message, type, target, year, userId: student.userId });
        return notif.save();
      }));
    } else if (target === 'section' && year && section) {
      const students = await Student.find({ year, section });
      if (!students.length) {
        return res.status(400).json({ message: `No students found for section ${section} and year ${year}` });
      }
      notifications = await Promise.all(students.map(student => {
        if (!student.userId) throw new Error(`Student ${student._id} missing userId`);
        const notif = new Notification({ message, type, target, year, section, userId: student.userId });
        return notif.save();
      }));
    } else {
      const notification = new Notification({ message, type, target: 'all' });
      await notification.save();
      notifications = [notification];
    }
    res.status(201).json({ message: 'Notification(s) sent', count: notifications.length });
  } catch (err) {
    console.error('Notification error:', err); 
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Bulk delete notifications
exports.bulkDeleteNotifications = async (req, res) => {
  try {
    // Log the incoming request body and user for debugging
    console.log('[bulkDeleteNotifications] req.body:', req.body);
    console.log('[bulkDeleteNotifications] req.user:', req.user);

    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ message: 'Missing or invalid request body.' });
    }
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'No notification IDs provided for bulk deletion.', received: ids });
    }
    // Only allow deletion by admin
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden: Only admins can bulk delete notifications.', user: req.user });
    }
    const result = await Notification.deleteMany({ _id: { $in: ids } });
    res.json({ message: 'Notifications deleted', deletedCount: result.deletedCount });
  } catch (err) {
    console.error('[bulkDeleteNotifications] ERROR:', err);
    res.status(500).json({ message: 'Server error', error: err.message, stack: err.stack });
  }
};

// Delete a notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Notification.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
