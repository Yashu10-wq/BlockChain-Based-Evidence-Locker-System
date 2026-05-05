require('dotenv').config({ path: __dirname + '/../.env' });
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

    console.log('-> Disabling anti-tampering triggers...');
    await pool.query('ALTER TABLE custody_logs DISABLE TRIGGER ALL;');



    console.log('-> Wiping all Evidence, Crimes, Custody Logs, and Reports...');
    await pool.query(`
      TRUNCATE TABLE 
        crimes, 
        evidence, 
        evidence_photos, 
        custody_logs, 
        forensic_reports, 
        audit_reports 
      CASCADE;
    `);


    console.log('-> Re-enabling anti-tampering triggers...');
    await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER ALL;');

    console.log('\n✅ Database wiped successfully! It is now completely fresh and ready for testing.');
    console.log('Note: User accounts were kept intact so you can still log in.');

    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to reset database:', err.message);
    process.exit(1);
  }
}

resetDatabase();
