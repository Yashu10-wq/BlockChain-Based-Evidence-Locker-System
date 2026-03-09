/**
 * ── Audit Controller ──────────────────────────────────────────
 * Allows Admins to run integrity audits on the custody chain
 * and retrieve past audit reports.
 *
 * The audit verifies that every custody log's current_hash matches
 * a re-computation from its fields, ensuring the chain is untampered.
 */

const CustodyLogModel = require('../models/custodyLogModel');
const EvidenceModel = require('../models/evidenceModel');
const AuditReportModel = require('../models/auditReportModel');
const { buildCustodyHash } = require('../utils/hashUtil');

/**
 * POST /api/audit/run
 * Role: Admin
 *
 * Iterates over every evidence item and validates the full
 * custody hash chain. Produces and persists an audit report.
 */
const runAudit = async (req, res) => {
    try {
        const adminId = req.user.id;

        // 1. Get all evidence
        const allEvidence = await EvidenceModel.findAll();

        let totalChecked = 0;
        let totalValid = 0;
        let totalInvalid = 0;
        const issues = [];

        // 2. For each evidence item, verify its custody chain
        for (const evidence of allEvidence) {
            const logs = await CustodyLogModel.findByEvidenceId(evidence.id);
            let previousHash = null;

            for (const log of logs) {
                totalChecked++;

                // Re-compute expected hash
                const expectedHash = buildCustodyHash(
                    log.evidence_id,
                    log.from_user,
                    log.to_user,
                    log.timestamp.toISOString(),
                    previousHash
                );

                // Compare stored previous_hash with what we expect
                if (log.previous_hash !== previousHash) {
                    totalInvalid++;
                    issues.push({
                        evidence_id: evidence.id,
                        log_id: log.id,
                        issue: 'previous_hash mismatch',
                        expected: previousHash,
                        found: log.previous_hash,
                    });
                } else if (log.current_hash !== expectedHash) {
                    // Compare stored current_hash with re-computed hash
                    totalInvalid++;
                    issues.push({
                        evidence_id: evidence.id,
                        log_id: log.id,
                        issue: 'current_hash mismatch (possible tampering)',
                        expected: expectedHash,
                        found: log.current_hash,
                    });
                } else {
                    totalValid++;
                }

                // Move forward in the chain
                previousHash = log.current_hash;
            }
        }

        // 3. Build report summary
        const reportSummary = JSON.stringify({
            audited_at: new Date().toISOString(),
            evidence_items: allEvidence.length,
            total_logs_checked: totalChecked,
            valid: totalValid,
            invalid: totalInvalid,
            issues,
        });

        // 4. Persist audit report
        const report = await AuditReportModel.create(adminId, reportSummary);

        return res.status(200).json({
            message: 'Audit completed.',
            summary: JSON.parse(reportSummary),
            report_id: report.id,
        });
    } catch (err) {
        console.error('Run audit error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/audit/reports
 * Role: Admin
 * Returns all audit reports (newest first).
 */
const getAuditReports = async (req, res) => {
    try {
        const reports = await AuditReportModel.findAll();

        // Parse report_summary back to JSON for each report
        const parsed = reports.map((r) => ({
            ...r,
            report_summary: JSON.parse(r.report_summary),
        }));

        return res.status(200).json({ reports: parsed });
    } catch (err) {
        console.error('Get audit reports error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { runAudit, getAuditReports };
