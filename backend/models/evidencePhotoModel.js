/**
 * ── Evidence Photo Model ──────────────────────────────────────
 * DB-access layer for the `evidence_photos` table.
 */

const pool = require('../config/db');

const EvidencePhotoModel = {
    /**
     * Insert a new photo record linked to an evidence item.
     */
    create: async (evidenceId, filePath) => {
        const { rows } = await pool.query(
            `INSERT INTO evidence_photos (evidence_id, file_path)
       VALUES ($1, $2) RETURNING *`,
            [evidenceId, filePath]
        );
        return rows[0];
    },

    /**
     * Get all photos for a given evidence ID.
     */
    findByEvidenceId: async (evidenceId) => {
        const { rows } = await pool.query(
            'SELECT * FROM evidence_photos WHERE evidence_id = $1 ORDER BY uploaded_at',
            [evidenceId]
        );
        return rows;
    },
};

module.exports = EvidencePhotoModel;
