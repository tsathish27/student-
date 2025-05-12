const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

// Get all audit logs, with optional filters
exports.getAuditLogs = async (req, res) => {
  try {
    const { user, action, date } = req.query;
    const filter = {};
    if (user) filter.user = user;
    if (action) filter.action = action;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.timestamp = { $gte: start, $lt: end };
    }
    let logs = await AuditLog.find(filter).sort({ timestamp: -1 });
    if (!logs.length) {
      const { mockAuditLogs } = require('../utils/mockData');
      logs = mockAuditLogs;
    }
    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
