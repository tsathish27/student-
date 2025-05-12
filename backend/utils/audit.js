const AuditLog = require('../models/AuditLog');

/**
 * Log an admin or user action
 * @param {ObjectId} userId
 * @param {String} action
 * @param {Object} details
 */
exports.logAction = async (userId, action, details = {}) => {
  try {
    await AuditLog.create({ userId, action, details });
  } catch (err) {
    // Optionally log to console or file
    console.error('Audit log error:', err.message);
  }
};
