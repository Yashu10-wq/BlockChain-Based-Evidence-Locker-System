/**
 * ── Evidence Controller ───────────────────────────────────────
 * Handles evidence registration, photo uploads, retrieval,
 * and locking of evidence records.
 */

const EvidenceModel = require('../models/evidenceModel');
const EvidencePhotoModel = require('../models/evidencePhotoModel');
const { generateQRCode } = require('../utils/qrUtil');

/**
 * POST /api/evidence/register
 * Body: { title, description, location_found }
 * Role: Officer
 */
const registerEvidence = async (req, res) => {
    try {
        const { title, description, location_found } = req.body;
        const officerId = req.user.id;

        // 1. Create the evidence record (QR generated after we have the ID)
        const evidence = await EvidenceModel.create(
            title, description, location_found, officerId, null
        );

        // 2. Generate QR code from evidence ID
        const qrCode = await generateQRCode(evidence.id);

        // 3. Update the record with the QR code
        const updated = await EvidenceModel.updateQRCode(evidence.id, qrCode);

        return res.status(201).json({
            message: 'Evidence registered successfully.',
            evidence: updated,
        });
    } catch (err) {
        console.error('Register evidence error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * POST /api/evidence/upload-photo
 * Body (multipart): evidence_id + photo file
 * Role: Officer
 */
const uploadPhoto = async (req, res) => {
    try {
        const { evidence_id } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No photo file uploaded.' });
        }

        // Verify evidence exists
        const evidence = await EvidenceModel.findById(evidence_id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        // Prevent uploads to locked evidence
        if (evidence.locked) {
            return res.status(403).json({ error: 'Evidence is locked. Cannot upload photos.' });
        }

        // Save photo record
        const photo = await EvidencePhotoModel.create(evidence_id, req.file.path);

        return res.status(201).json({
            message: 'Photo uploaded successfully.',
            photo,
        });
    } catch (err) {
        console.error('Upload photo error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/evidence/:id
 * Returns the evidence record along with its photos.
 * Role: Any authenticated user
 */
const getEvidence = async (req, res) => {
    try {
        const evidence = await EvidenceModel.findById(req.params.id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        const photos = await EvidencePhotoModel.findByEvidenceId(evidence.id);

        return res.status(200).json({ evidence, photos });
    } catch (err) {
        console.error('Get evidence error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * POST /api/evidence/lock
 * Body: { evidence_id }
 * Role: Officer
 * Locks the evidence record so it can no longer be modified.
 */
const lockEvidence = async (req, res) => {
    try {
        const { evidence_id } = req.body;

        const evidence = await EvidenceModel.findById(evidence_id);
        if (!evidence) {
            return res.status(404).json({ error: 'Evidence not found.' });
        }

        if (evidence.locked) {
            return res.status(400).json({ error: 'Evidence is already locked.' });
        }

        // Only the registering officer can lock
        if (evidence.officer_id !== req.user.id) {
            return res.status(403).json({ error: 'Only the registering officer can lock this evidence.' });
        }

        const locked = await EvidenceModel.lock(evidence_id);

        return res.status(200).json({
            message: 'Evidence locked successfully.',
            evidence: locked,
        });
    } catch (err) {
        console.error('Lock evidence error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { registerEvidence, uploadPhoto, getEvidence, lockEvidence };
