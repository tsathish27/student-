// Allows requests with or without authentication; sets req.user if authenticated, otherwise continues as guest.
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function authOptional(req, res, next) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
      req.user = await User.findById(decoded.id).select('-passwordHash');
    } catch (err) {
      // Ignore invalid token, continue as guest
      req.user = null;
    }
  } else {
    req.user = null;
  }
  next();
};
