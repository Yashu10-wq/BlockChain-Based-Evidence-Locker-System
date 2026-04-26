/**
 * ── Audit Controller ──────────────────────────────────────────
 * Admin: run full audits, verify individual evidence chains,
 * and retrieve past audit reports.
 *
 * Phase 2: Uses BlockchainService.verifyChain() for real
 * block-level integrity verification.
 */

const CustodyLogModel  = require('../models/custodyLogModel');
const EvidenceModel    = require('../models/evidenceModel');
const AuditReportModel = require('../models/auditReportModel');
const { BlockchainService } = require('../services/blockchainService');

/**
 * POST /api/audit/run
 * Role: Admin
 * Validates the full blockchain for EVERY evidence item.
 */
const runAudit = async (req, res) => {
  try {
    const adminId = req.user.id;
    const allEvidence = await EvidenceModel.findAll();

    let totalChecked = 0;
    let totalValid   = 0;
    let totalInvalid = 0;
    const issues     = [];

    for (const evidence of allEvidence) {
      const result = await BlockchainService.verifyChain(evidence.id);
      totalChecked++;

      if (result.valid) {
        totalValid++;
      } else {
        totalInvalid++;
        issues.push({
          evidence_id: evidence.id,
          title:       evidence.title,
          brokenAt:    result.brokenAt,
          totalBlocks: result.blocks.length,
        });
      }
    }

    const reportSummary = JSON.stringify({
      audited_at:      new Date().toISOString(),
      evidence_items:  allEvidence.length,
      total_checked:   totalChecked,
      valid:           totalValid,
      invalid:         totalInvalid,
      issues,
    });

    const report = await AuditReportModel.create(adminId, reportSummary);

    return res.status(200).json({
      message:   'Audit completed.',
      summary:   JSON.parse(reportSummary),
      report_id: report.id,
    });
  } catch (err) {
    console.error('Run audit error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/audit/verify/:evidence_id
 * Role: Admin
 * Verify the blockchain for a single evidence item.
 * Returns { valid, blocks, brokenAt }.
 */
const verifyChain = async (req, res) => {
  try {
    const { evidence_id } = req.params;

    const evidence = await EvidenceModel.findById(evidence_id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found.' });
    }

    const result = await BlockchainService.verifyChain(evidence_id);

    return res.status(200).json({
      evidence_id,
      title: evidence.title,
      ...result,
    });
  } catch (err) {
    console.error('Verify chain error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/audit/reports
 * Role: Admin
 */
const getAuditReports = async (req, res) => {
  try {
    const reports = await AuditReportModel.findAll();
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

module.exports = { runAudit, verifyChain, getAuditReports };
