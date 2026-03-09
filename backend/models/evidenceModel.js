/**
 * ── Evidence Model ────────────────────────────────────────────
 * DB-access layer for the `evidence` table.
 */

const pool = require('../config/db');

const EvidenceModel = {
    /**
     * Register a new evidence record.
     */
    create: async (title, description, locationFound, officerId, qrCode) => {
        const { rows } = await pool.query(
            `INSERT INTO evidence (title, description, location_found, officer_id, qr_code)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
            [title, description, locationFound, officerId, qrCode]
        );
        return rows[0];
    },

    /**
     * Find evidence by ID.
     */
    findById: async (id) => {
        const { rows } = await pool.query(
            'SELECT * FROM evidence WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Retrieve all evidence records.
     */
    findAll: async () => {
        const { rows } = await pool.query(
            'SELECT * FROM evidence ORDER BY created_at DESC'
        );
        return rows;
    },

    /**
     * Lock an evidence record so it can no longer be edited.
     */
    lock: async (id) => {
        const { rows } = await pool.query(
            `UPDATE evidence SET locked = TRUE WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0] || null;
    },

    /**
     * Update the QR code for an evidence record.
     */
    updateQRCode: async (id, qrCode) => {
        const { rows } = await pool.query(
            `UPDATE evidence SET qr_code = $1 WHERE id = $2 RETURNING *`,
            [qrCode, id]
        );
        return rows[0] || null;
    },
};

module.exports = EvidenceModel;
