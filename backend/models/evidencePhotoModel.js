const pool = require('../config/db');

const EvidencePhotoModel = {
  

  create: async (evidenceId, filePath, publicId = null, version = null) => {
    const { rows } = await pool.query(
      `INSERT INTO evidence_photos (evidence_id, file_path, cloudinary_public_id, cloudinary_version)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [evidenceId, filePath, publicId, version]
    );
    return rows[0];
  },

  

  findByEvidenceId: async (evidenceId) => {
    const { rows } = await pool.query(
      'SELECT * FROM evidence_photos WHERE evidence_id = $1 ORDER BY uploaded_at',
      [evidenceId]
    );
    return rows;
  },
};

module.exports = EvidencePhotoModel;
