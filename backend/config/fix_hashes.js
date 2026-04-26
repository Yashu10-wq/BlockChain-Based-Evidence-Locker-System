require('dotenv').config({ path: __dirname + '/../.env' });
const pool = require('./db');
const { Block } = require('../services/blockchainService');

async function fixHashes() {
    console.log('Starting Blockchain Hash Repair...');

    try {
        // 1. Disable the trigger
        await pool.query('ALTER TABLE custody_logs DISABLE TRIGGER prevent_update_delete');
        console.log('Disabled tampering trigger temporarily...');

        // 2. Get all unique evidence IDs
        const { rows: evidenceRows } = await pool.query('SELECT DISTINCT evidence_id FROM custody_logs');
        
        for (const e of evidenceRows) {
            const evidenceId = e.evidence_id;
            console.log(`Fixing chain for Evidence #${evidenceId}...`);

            // 3. Fetch all logs for this evidence, ordered by block_index
            const { rows: logs } = await pool.query(
                'SELECT * FROM custody_logs WHERE evidence_id = $1 ORDER BY block_index ASC',
                [evidenceId]
            );

            let previousHash = '0';

            for (const log of logs) {
                // 4. Recreate the block data exactly as verifyChain does
                const data = {
                    evidence_id: log.evidence_id,
                    from_user: log.from_user,
                    to_user: log.to_user,
                };

                // Use the database's stored timestamp
                const timestampStr = log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp;

                const block = new Block(
                    log.block_index,
                    timestampStr,
                    data,
                    previousHash
                );

                // 5. Update the log with the correct recalculated hash
                await pool.query(
                    'UPDATE custody_logs SET current_hash = $1, previous_hash = $2 WHERE id = $3',
                    [block.hash, previousHash === '0' ? null : previousHash, log.id]
                );

                console.log(`  - Block #${log.block_index} fixed. New hash: ${block.hash.substring(0, 16)}...`);
                previousHash = block.hash;
            }
        }

        // 6. Re-enable the trigger
        await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER prevent_update_delete');
        console.log('Re-enabled tampering trigger.');

        console.log('✅ All blockchain hashes have been successfully repaired!');
        process.exit(0);
    } catch (err) {
        console.error('Failed to repair hashes:', err);
        process.exit(1);
    }
}

fixHashes();
