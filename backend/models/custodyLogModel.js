/**
 * ── Custody Log Model ─────────────────────────────────────────
 * DB-access layer for the `custody_logs` table.
 * Each row forms a link in the SHA-256 blockchain ledger.
 */

const pool = require('../config/db');

const CustodyLogModel = {
  /**
   * Append a new custody log entry (legacy — without block_index).
   */
  create: async (evidenceId, fromUser, toUser, previousHash, currentHash) => {
    const { rows } = await pool.query(
      `INSERT INTO custody_logs (evidence_id, from_user, to_user, previous_hash, current_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [evidenceId, fromUser, toUser, previousHash, currentHash]
    );
    return rows[0];
  },

  /**
   * Append a new custody log entry WITH block_index, status, and exact timestamp.
   */
  createWithIndex: async (evidenceId, fromUser, toUser, previousHash, currentHash, blockIndex, status = 'ACCEPTED', timestamp) => {
    const { rows } = await pool.query(
      `INSERT INTO custody_logs (evidence_id, from_user, to_user, previous_hash, current_hash, block_index, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [evidenceId, fromUser, toUser, previousHash, currentHash, blockIndex, status, timestamp]
    );
    return rows[0];
  },

  /**
   * Get the full custody chain for an evidence item (oldest → newest).
   */
  findByEvidenceId: async (evidenceId) => {
    const { rows } = await pool.query(
      'SELECT * FROM custody_logs WHERE evidence_id = $1 ORDER BY timestamp ASC',
      [evidenceId]
    );
    return rows;
  },

  /**
   * Get the most recent custody log for an evidence item.
   */
  getLatest: async (evidenceId) => {
    const { rows } = await pool.query(
      `SELECT * FROM custody_logs
       WHERE evidence_id = $1
       ORDER BY timestamp DESC
       LIMIT 1`,
      [evidenceId]
    );
    return rows[0] || null;
  },
};

module.exports = CustodyLogModel;
