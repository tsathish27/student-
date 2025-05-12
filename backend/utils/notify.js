const Notification = require('../models/Notification');

/**
 * Send a notification to a user (or broadcast if userId is null)
 * @param {String|null} userId
 * @param {String} message
 * @param {String} type
 */
exports.sendNotification = async (userId, message, type = 'info') => {
  try {
    await Notification.create({ userId, message, type });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};
