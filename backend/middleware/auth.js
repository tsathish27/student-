const jwt = require('jsonwebtoken');

const auth = (roles = []) => {
  if (typeof roles === 'string') {
    roles = [roles];
  }
  return (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('[AUTH] No token provided');
      return res.status(401).json({ message: 'No token, authorization denied' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      console.log('[AUTH] Token valid, user:', decoded);
      if (roles.length && !roles.includes(decoded.role)) {
        console.log('[AUTH] Forbidden: insufficient role', decoded.role);
        return res.status(403).json({ message: 'Forbidden: insufficient role' });
      }
      next();
    } catch (err) {
      console.log('[AUTH] Invalid token', err.message);
      res.status(401).json({ message: 'Token is not valid' });
    }
  };
};

module.exports = auth;
