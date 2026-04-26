/**
 * ── Crime Model ────────────────────────────────────────────────
 * DB-access layer for the `crimes` table.
 */

const pool = require('../config/db');

const CrimeModel = {
    /**
     * Create a new crime folder.
     */
    create: async (title, description, officerId) => {
        const { rows } = await pool.query(
            `INSERT INTO crimes (title, description, officer_id)
             VALUES ($1, $2, $3) RETURNING *`,
            [title, description, officerId]
        );
        return rows[0];
    },

    /**
     * Find a crime by ID.
     */
    findById: async (id) => {
        const { rows } = await pool.query(
            'SELECT * FROM crimes WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Retrieve all crime records.
     */
    findAll: async () => {
        const { rows } = await pool.query(
            'SELECT * FROM crimes ORDER BY created_at DESC'
        );
        return rows;
    },

    /**
     * Retrieve crimes that have at least one piece of evidence visible to a user.
     * This ensures the Dashboard only lists crimes relevant to the user's custody.
     */
    findVisibleToUser: async (userId) => {
        const { rows } = await pool.query(
            `SELECT DISTINCT c.*
             FROM crimes c
             LEFT JOIN evidence e ON c.id = e.crime_id
             WHERE c.officer_id = $1
             OR e.officer_id = $1
             OR e.id IN (
                 SELECT cl.evidence_id
                 FROM custody_logs cl
                 WHERE (
                     (cl.to_user = $1 AND cl.status = 'ACCEPTED')
                     OR
                     (cl.from_user = $1 AND cl.status = 'PENDING')
                 )
                 AND cl.timestamp = (
                     SELECT MAX(cl2.timestamp)
                     FROM custody_logs cl2
                     WHERE cl2.evidence_id = cl.evidence_id
                 )
             )
             ORDER BY c.created_at DESC`,
            [userId]
        );
        return rows;
    }
};

module.exports = CrimeModel;
