// db.js - PostgreSQL database connection pool
const { Pool } = require('pg');
require('dotenv').config();

// Initialize PostgreSQL connection pool using environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'hotel_db',
  max: 20, // Maximum pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Event listener for unexpected errors on idle clients
pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

// Helper query function for native parameterized SQL execution
module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
