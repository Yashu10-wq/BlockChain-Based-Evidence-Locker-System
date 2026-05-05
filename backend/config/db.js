const { Pool, types } = require('pg');


types.setTypeParser(1114, (str) => new Date(str + 'Z'));
types.setTypeParser(1184, (str) => new Date(str));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});


pool.query('SELECT 1')
  .then(() => console.log('✅  Connected to PostgreSQL'))
  .catch((err) => console.error('❌  PostgreSQL connection failed:', err.message));


pool.on('error', (err) => {
  console.error('❌  PostgreSQL pool error:', err.message);
});

module.exports = pool;
