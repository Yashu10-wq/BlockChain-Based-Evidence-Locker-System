/**
 * ── Audit Report Model ────────────────────────────────────────
 * DB-access layer for the `audit_reports` table.
 */

const pool = require('../config/db');

const AuditReportModel = {
    /**
     * Insert a new audit report.
     */
    create: async (adminId, reportSummary) => {
        const { rows } = await pool.query(
            `INSERT INTO audit_reports (admin_id, report_summary)
       VALUES ($1, $2) RETURNING *`,
            [adminId, reportSummary]
        );
        return rows[0];
    },

    /**
     * Retrieve all audit reports (newest first).
     */
    findAll: async () => {
        const { rows } = await pool.query(
            'SELECT * FROM audit_reports ORDER BY created_at DESC'
        );
        return rows;
    },
};

module.exports = AuditReportModel;
