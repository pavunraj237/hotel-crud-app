// server.js - Express application entry point
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const hotelsRouter = require('./routes/hotels');
const authRouter = require('./routes/auth');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;

// Configured origins for credentials and cookies
const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, or same-origin)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, true); // Permissive in dev while maintaining credentials: true
    },
    credentials: true, // Allow HTTP-only cookies across requests
  })
);

// Parse cookie headers and populate req.cookies
app.use(cookieParser());

// Parse incoming JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const result = await db.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      serverTime: result.rows[0].now,
      database: 'connected',
    });
  } catch (err) {
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || '5432';
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      code: err.code || 'UNKNOWN',
      message: err.message,
      help: `Cannot reach PostgreSQL at ${host}:${port}. Please verify that PostgreSQL is running and check your .env database credentials (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME). If PostgreSQL is installed on a non-default port (e.g. 5433), update DB_PORT in .env.`,
    });
  }
});

// Authentication routes
app.use('/api/auth', authRouter);

// Hotel routes
app.use('/api/hotels', hotelsRouter);

// Global 404 handler for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack || err.message);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Hotel CRUD Backend running at http://localhost:${PORT}`);
  console.log(`Static uploads accessible at http://localhost:${PORT}/uploads`);
});
