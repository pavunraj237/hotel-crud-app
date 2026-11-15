// middleware/auth.js - Authentication and Administrator Authorization middleware
const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  // Read token from secure HTTP-only cookie
  const token = req.cookies ? req.cookies.token : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please log in.' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('CRITICAL: JWT_SECRET environment variable is not defined.');
    return res.status(500).json({ error: 'Server configuration error.' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    // Attach decoded user info to request (id, name, email, role)
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Your session has expired. Please log in again.' });
    }
    return res.status(401).json({ error: 'Invalid authentication session. Please log in again.' });
  }
};

// Enforces that the authenticated user is an administrator
const requireAdmin = (req, res, next) => {
  requireAuth(req, res, () => {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        error: 'Forbidden: Administrator privileges required to perform this action.',
      });
    }
    next();
  });
};

module.exports = {
  requireAuth,
  requireAdmin,
};
