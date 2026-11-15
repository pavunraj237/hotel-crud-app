// routes/auth.js - Authentication routes: admin login, logout, me, disabled public signup
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Rate limiting for auth endpoints (prevents brute-force attacks)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute window
  max: 20, // Max 20 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
  },
});

// Helper to generate JWT and set secure HTTP-only cookie with role
const setAuthCookie = (res, user) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not defined');
  }

  // Token expires in 7 days and includes role
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user',
    },
    secret,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });
};

// -------------------------------------------------------------
// POST /api/auth/signup - Disabled per requirements (No public signup)
// -------------------------------------------------------------
router.post('/signup', (req, res) => {
  return res.status(403).json({
    error: 'Public registration is disabled. Hotel management is restricted to authorized administrators.',
  });
});

// -------------------------------------------------------------
// POST /api/auth/login - Administrator authentication
// -------------------------------------------------------------
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Query user by email including role
    const query = 'SELECT id, name, email, password_hash, role, created_at FROM users WHERE LOWER(email) = LOWER($1)';
    const result = await db.query(query, [normalizedEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];

    // Compare bcrypt password hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Verify admin privileges
    if (user.role !== 'admin') {
      return res.status(403).json({
        error: 'Access denied: Administrator privileges are required to log in to this portal.',
      });
    }

    // Set secure HTTP-only cookie with role
    setAuthCookie(res, user);

    res.json({
      message: 'Admin authenticated successfully!',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Login error:', err.message);
    if (err.code === 'ECONNREFUSED' || err.message?.includes('ECONNREFUSED')) {
      return res.status(503).json({
        error: `PostgreSQL connection refused at ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || '5432'}. Please verify PostgreSQL is running.`,
      });
    }
    res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

// -------------------------------------------------------------
// POST /api/auth/logout - Clear auth cookie
// -------------------------------------------------------------
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    path: '/',
  });
  res.json({ message: 'Logged out successfully.' });
});

// -------------------------------------------------------------
// GET /api/auth/me - Get current authenticated user session
// -------------------------------------------------------------
router.get('/me', requireAuth, async (req, res) => {
  try {
    const query = 'SELECT id, name, email, role, created_at FROM users WHERE id = $1';
    const result = await db.query(query, [req.user.id]);

    if (result.rows.length === 0) {
      res.clearCookie('token', { path: '/' });
      return res.status(401).json({ error: 'User account no longer exists.' });
    }

    const user = result.rows[0];
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
    });
  } catch (err) {
    console.error('Auth verification error:', err.message);
    res.status(500).json({ error: 'Failed to verify session.' });
  }
});

module.exports = router;
