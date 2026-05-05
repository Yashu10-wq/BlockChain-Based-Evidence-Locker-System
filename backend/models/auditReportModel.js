const pool = require('../config/db');

const AuditReportModel = {
    


    create: async (adminId, reportSummary) => {
        const { rows } = await pool.query(
            `INSERT INTO audit_reports (admin_id, report_summary)
       VALUES ($1, $2) RETURNING *`,
            [adminId, reportSummary]
        );
        return rows[0];
    },

    


    findAll: async () => {
        const { rows } = await pool.query(
            'SELECT * FROM audit_reports ORDER BY created_at DESC'
        );
        return rows;
    },
};

module.exports = AuditReportModel;
