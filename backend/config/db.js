/**
 * ── Database Configuration ─────────────────────────────────────
 * Creates a PostgreSQL connection pool using the pg library.
 * All models use this shared pool for queries.
 */

const { Pool, types } = require('pg');

// ── CRITICAL: Force PostgreSQL timestamps to parse as UTC ──────
// Without this, the pg driver interprets TIMESTAMP WITHOUT TIME ZONE
// values in the local timezone (e.g. IST), which shifts the time by
// hours and completely breaks blockchain hash verification.
types.setTypeParser(1114, (str) => new Date(str + 'Z'));  // TIMESTAMP
types.setTypeParser(1184, (str) => new Date(str));         // TIMESTAMPTZ

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Verify connection once at startup
pool.query('SELECT 1')
  .then(() => console.log('✅  Connected to PostgreSQL'))
  .catch((err) => console.error('❌  PostgreSQL connection failed:', err.message));

// Log pool errors
pool.on('error', (err) => {
  console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
