require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
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
    
    const { rows } = await pool.query(
      'SELECT id, to_user, block_index FROM custody_logs WHERE evidence_id = $1 ORDER BY block_index DESC LIMIT 1',
      [evidenceId]
    );

    if (rows.length === 0) {
      console.error(`❌ No custody logs found for Evidence #${evidenceId}`);
      process.exit(1);
    }

    const logToTamper = rows[0];
    
    
    const newUserId = logToTamper.to_user === 9999 ? 8888 : 9999; 

    
    console.log(' -> Bypassing PostgreSQL triggers (ALTER TABLE DISABLE TRIGGER ALL)...');
    await pool.query('ALTER TABLE custody_logs DISABLE TRIGGER ALL;');
    
    
    console.log(` -> Injecting malicious data into block #${logToTamper.block_index}...`);
    await pool.query(
      'UPDATE custody_logs SET to_user = $1 WHERE id = $2',
      [newUserId, logToTamper.id]
    );

    
    console.log(' -> Covering tracks (ALTER TABLE ENABLE TRIGGER ALL)...');
    await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER ALL;');

    
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
    process.exit(1);
  }
}

simulateTamper();
