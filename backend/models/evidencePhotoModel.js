/**
 * ── Evidence Photo Model ──────────────────────────────────────
 * DB-access layer for the `evidence_photos` table.
 * Phase 2: supports Cloudinary public_id and version columns.
 */

const pool = require('../config/db');

const EvidencePhotoModel = {
  /**
   * Insert a new photo record with Cloudinary metadata.
   * @param {number} evidenceId
   * @param {string} filePath      - Cloudinary secure_url
   * @param {string} publicId      - Cloudinary public_id
   * @param {string} version       - Cloudinary version/etag
   */
  create: async (evidenceId, filePath, publicId = null, version = null) => {
    const { rows } = await pool.query(
      `INSERT INTO evidence_photos (evidence_id, file_path, cloudinary_public_id, cloudinary_version)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [evidenceId, filePath, publicId, version]
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
