/**
 * ── Forensic Controller ───────────────────────────────────────
 * Allows Forensic Technicians to upload analysis reports
 * and retrieve reports attached to evidence items.
 */

const ForensicReportModel = require('../models/forensicReportModel');
const EvidenceModel = require('../models/evidenceModel');

/**
 * POST /api/forensic/upload-report
 * Body (multipart): evidence_id + report file
 * Role: Forensic Technician
 */
const uploadReport = async (req, res) => {
    try {
        const { evidence_id } = req.body;
        const technicianId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No report file uploaded.' });
        }

        // Verify evidence exists
        const evidence = await EvidenceModel.findById(evidence_id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        // Save forensic report record
        const report = await ForensicReportModel.create(
            evidence_id, technicianId, req.file.path
        );

        return res.status(201).json({
            message: 'Forensic report uploaded successfully.',
            report,
        });
    } catch (err) {
        console.error('Upload forensic report error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/forensic/reports/:evidence_id
 * Returns all forensic reports for a given evidence item.
 * Role: Forensic Technician, Admin
 */
const getReports = async (req, res) => {
    try {
        const { evidence_id } = req.params;
        const reports = await ForensicReportModel.findByEvidenceId(evidence_id);
        return res.status(200).json({ evidence_id, reports });
    } catch (err) {
        console.error('Get forensic reports error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { uploadReport, getReports };
