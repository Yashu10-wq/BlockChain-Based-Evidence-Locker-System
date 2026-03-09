/**
 * ── Database Configuration ─────────────────────────────────────
 * Creates a PostgreSQL connection pool using the pg library.
 * All models use this shared pool for queries.
 */

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log successful connection (once)
pool.on('connect', () => {
  console.log('✅  Connected to PostgreSQL');
});

// Log pool errors
pool.on('error', (err) => {
  console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
