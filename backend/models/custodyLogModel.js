const pool = require('../config/db');

const CustodyLogModel = {
  

  create: async (evidenceId, fromUser, toUser, previousHash, currentHash) => {
    const { rows } = await pool.query(
      `INSERT INTO custody_logs (evidence_id, from_user, to_user, previous_hash, current_hash)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [evidenceId, fromUser, toUser, previousHash, currentHash]
    );
    return rows[0];
  },

  

  createWithIndex: async (evidenceId, fromUser, toUser, previousHash, currentHash, blockIndex, status = 'ACCEPTED', timestamp) => {
    const { rows } = await pool.query(
      `INSERT INTO custody_logs (evidence_id, from_user, to_user, previous_hash, current_hash, block_index, status, timestamp)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [evidenceId, fromUser, toUser, previousHash, currentHash, blockIndex, status, timestamp]
    );
    return rows[0];
  },

  

  findByEvidenceId: async (evidenceId) => {
    const { rows } = await pool.query(
      'SELECT * FROM custody_logs WHERE evidence_id = $1 ORDER BY timestamp ASC',
      [evidenceId]
    );
    return rows;
  },

  

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
