require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function addHackerRole() {
  try {
    console.log("Adding Hacker role to ENUM...");
    await pool.query(`ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'Hacker'`);
    console.log("✅ Hacker role added to ENUM.");
  } catch (err) {
    if (err.code === '23505' || err.message.includes('already exists')) {
      console.log("Hacker role already exists in ENUM.");
    } else {
      console.error("Error adding role:", err);
    }
  } finally {
    pool.end();
  }
}

addHackerRole();
