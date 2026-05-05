const ForensicReportModel = require('../models/forensicReportModel');
const EvidenceModel = require('../models/evidenceModel');

const uploadReport = async (req, res) => {
    try {
        const { evidence_id } = req.body;
        const technicianId = req.user.id;

        if (!req.file) {
            return res.status(400).json({ error: 'No report file uploaded.' });
        }

        
        const evidence = await EvidenceModel.findById(evidence_id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        
        const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

        const report = await ForensicReportModel.create(
            evidence_id, technicianId, fileUrl
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
