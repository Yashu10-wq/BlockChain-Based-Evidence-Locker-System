const pool = require('../config/db');

const EvidenceModel = {
    


    create: async (crimeId, title, description, locationFound, officerId, qrCode) => {
        const { rows } = await pool.query(
            `INSERT INTO evidence (crime_id, title, description, location_found, officer_id, qr_code)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [crimeId, title, description, locationFound, officerId, qrCode]
        );
        return rows[0];
    },

    


    findById: async (id) => {
        const { rows } = await pool.query(
            'SELECT * FROM evidence WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    


    findAll: async () => {
        const { rows } = await pool.query(
            'SELECT * FROM evidence ORDER BY created_at DESC'
        );
        return rows;
    },

    


    findVisibleToUser: async (userId) => {
        const { rows } = await pool.query(
            `SELECT e.*
             FROM evidence e
             WHERE e.officer_id = $1
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
             ORDER BY e.created_at DESC`,
            [userId]
        );
        return rows;
    },

    


    lock: async (id) => {
        const { rows } = await pool.query(
            `UPDATE evidence SET locked = TRUE WHERE id = $1 RETURNING *`,
            [id]
        );
        return rows[0] || null;
    },

    


    updateQRCode: async (id, qrCode) => {
        const { rows } = await pool.query(
            `UPDATE evidence SET qr_code = $1 WHERE id = $2 RETURNING *`,
            [qrCode, id]
        );
        return rows[0] || null;
    },
};

module.exports = EvidenceModel;
