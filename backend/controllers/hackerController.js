/**
 * ── Hacker Controller ─────────────────────────────────────────
 * Exposes endpoints for the 'Hacker' role to simulate database
 * tampering. It bypasses the anti-tamper PostgreSQL triggers 
 * explicitly to demonstrate the blockchain integrity system.
 */

const pool = require('../config/db');
const EvidenceModel = require('../models/evidenceModel');

const tamperEvidence = async (req, res) => {
    try {
        const { evidence_id } = req.body;

        if (!evidence_id) {
            return res.status(400).json({ error: 'Evidence ID is required.' });
        }

        const evidence = await EvidenceModel.findById(evidence_id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        // We temporarily disable USER triggers (which includes our prevent_update_delete trigger)
        // We use USER instead of ALL so we don't try to disable internal foreign key constraint triggers
        await pool.query('ALTER TABLE custody_logs DISABLE TRIGGER USER;');

        try {
            // Find a block to tamper (preferably not the genesis block if others exist)
            const getLogsQuery = `SELECT * FROM custody_logs WHERE evidence_id = $1 ORDER BY block_index ASC`;
            const logsRes = await pool.query(getLogsQuery, [evidence_id]);
            const logs = logsRes.rows;

            if (logs.length === 0) {
                return res.status(400).json({ error: 'No custody logs found for this evidence to tamper.' });
            }

            // Pick a target block. If length > 1, tamper the second block (index 1), else tamper index 0.
            const targetBlock = logs.length > 1 ? logs[1] : logs[0];

            // Perform the tamper: change the 'to_user' to the hacker's own user ID!
            // This is guaranteed to exist in the 'users' table, avoiding foreign key errors,
            // but it will instantly invalidate the cryptographic hash.
            const tamperQuery = `
                UPDATE custody_logs 
                SET to_user = $1 
                WHERE id = $2
            `;
            await pool.query(tamperQuery, [req.user.id, targetBlock.id]);

        } finally {
            // Always re-enable triggers!
            await pool.query('ALTER TABLE custody_logs ENABLE TRIGGER USER;');
        }

        return res.status(200).json({
            message: `Evidence #${evidence_id} successfully tampered in the database!`,
        });

    } catch (err) {
        console.error('Tamper evidence error:', err.message);
        return res.status(500).json({ error: 'Internal server error while tampering.' });
    }
};

module.exports = { tamperEvidence };
