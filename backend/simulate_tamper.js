require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function simulateTamper() {
  const evidenceId = process.argv[2];

  if (!evidenceId) {
    console.error('❌ Usage: node simulate_tamper.js <evidence_id>');
    console.error('Example: node simulate_tamper.js 1');
    process.exit(1);
  }

  console.log(`[ATTACK INITIATED] Targeting Evidence #${evidenceId}...`);

  try {
    // 1. Get the latest block for this evidence
    const { rows } = await pool.query(
      'SELECT id, to_user, block_index FROM custody_logs WHERE evidence_id = $1 ORDER BY block_index DESC LIMIT 1',
      [evidenceId]
    );

    if (rows.length === 0) {
      console.error(`❌ No custody logs found for Evidence #${evidenceId}`);
      process.exit(1);
    }

    const logToTamper = rows[0];

    // 2. THE FIX: Fetch another VALID user from the database to inject
    const { rows: otherUsers } = await pool.query(
      'SELECT id FROM users WHERE id != $1 LIMIT 1',
      [logToTamper.to_user] // Current owner ko chhod kar koi bhi aur user laao
    );

    if (otherUsers.length === 0) {
      console.error('❌ Tamper failed: You need at least TWO registered users in the database to simulate a fake transfer.');
      console.log('💡 Tip: Go to your frontend and register one more dummy user, then run this again.');
      process.exit(1);
    }

    const newUserId = otherUsers[0].id; // Asli user ID mil gayi!

    console.log(' -> Bypassing custom triggers (ALTER TABLE DISABLE TRIGGER USER)...');
    await pool.query('ALTER TABLE custody_logs DISABLE TRIGGER USER;');

    console.log(` -> Injecting malicious valid user ID (${newUserId}) into block #${logToTamper.block_index}...`);
    await pool.query(
      'UPDATE custody_logs SET to_user = $1 WHERE id = $2',
      [newUserId, logToTamper.id]
    );

    console.log(' -> Covering tracks (ALTER TABLE ENABLE TRIGGER USER)...');
    await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER USER;');

    console.log('\n' + '='.repeat(60));
    console.log('🚨 DATABASE MANIPULATED: Evidence history altered successfully 🚨');
    console.log('='.repeat(60));
    console.log(`  Targeted Evidence ID : ${evidenceId}`);
    console.log(`  Tampered Block       : #${logToTamper.block_index}`);
    console.log(`  Original to_user     : ${logToTamper.to_user}`);
    console.log(`  Injected to_user     : ${newUserId}`);
    console.log('='.repeat(60));
    console.log('Go to your frontend, open the Integrity Audit page, and run the audit to see the system catch this hack!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Tamper script failed:', error.message);
    try {
      await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER USER;');
    } catch (cleanupError) { }
    process.exit(1);
  }
}

simulateTamper();