require('dotenv').config({ path: __dirname + '/../.env' }); // Apne path ke hisaab se check kar lena
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function resetDatabase() {
  console.log('⚠️  Starting Database Reset Process...');

  try {
    console.log('-> Wiping all Evidence, Crimes, Custody Logs, and Reports...');

    // CASCADE sab handle kar lega, triggers disable karne ki zarurat nahi hai
    // RESTART IDENTITY se auto-increment IDs wapas 1 se shuru hongi
    await pool.query(`
      TRUNCATE TABLE 
        crimes, 
        evidence, 
        evidence_photos, 
        custody_logs, 
        forensic_reports, 
        audit_reports 
      RESTART IDENTITY CASCADE;
    `);

    console.log('\n✅ Database wiped successfully! It is now completely fresh and ready for testing.');
    console.log('Note: User accounts (users table) were kept intact so you can still log in.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset database:', err.message);
    process.exit(1);
  }
}

resetDatabase();