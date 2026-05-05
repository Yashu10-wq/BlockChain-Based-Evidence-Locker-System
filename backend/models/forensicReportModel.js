const pool = require('../config/db');

const ForensicReportModel = {
    


    create: async (evidenceId, technicianId, reportFile) => {
        const { rows } = await pool.query(
            `INSERT INTO forensic_reports (evidence_id, technician_id, report_file)
       VALUES ($1, $2, $3) RETURNING *`,
            [evidenceId, technicianId, reportFile]
        );
        return rows[0];
    },

    


    findByEvidenceId: async (evidenceId) => {
        const { rows } = await pool.query(
            'SELECT * FROM forensic_reports WHERE evidence_id = $1 ORDER BY uploaded_at',
            [evidenceId]
        );
        return rows;
    },
};

module.exports = ForensicReportModel;
