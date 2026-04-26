/**
 * ── Evidence Controller ───────────────────────────────────────
 * Handles evidence registration, photo uploads (via Cloudinary),
 * retrieval, and locking of evidence records.
 *
 * Phase 2: Photos are uploaded to Cloudinary. The photo's
 * version/etag is hashed into a genesis blockchain block
 * to seal the image in the chain.
 */

const fs = require('fs');
const EvidenceModel       = require('../models/evidenceModel');
const EvidencePhotoModel  = require('../models/evidencePhotoModel');
const { generateQRCode }  = require('../utils/qrUtil');
const cloudinary          = require('../config/cloudinary');
const { BlockchainService } = require('../services/blockchainService');
const CustodyLogModel     = require('../models/custodyLogModel');

/**
 * POST /api/evidence/register
 * Body: { title, description, location_found }
 * Role: Officer
 */
const registerEvidence = async (req, res) => {
  try {
    const { crime_id, title, description, location_found } = req.body;
    const officerId = req.user.id;

    // 1. Create evidence record (QR generated after we have the ID)
    const evidence = await EvidenceModel.create(
      crime_id, title, description, location_found, officerId, null
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
 *
 * Flow:
 *  Multer saves to local temp →
 *  Upload to Cloudinary →
 *  Store secure_url + public_id + version in DB →
 *  Delete local temp file →
 *  Mine a genesis/photo block including photo version in hash.
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

    // Verify current custody (only Admin or current custodian/officer can upload)
    if (req.user.role !== 'Admin') {
      const latestLog = await CustodyLogModel.getLatest(evidence_id);
      const currentHolderId = latestLog ? latestLog.to_user : evidence.officer_id;
      if (currentHolderId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied. You do not currently hold custody of this evidence.' });
      }
    }

    // ── Upload to Cloudinary ─────────────────────────────────
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: `evidence_locker/${evidence_id}`,
      resource_type: 'image',
    });

    // Delete local temp file after successful upload
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('Failed to delete temp file:', err.message);
    });

    // ── Persist photo record with Cloudinary metadata ────────
    const photo = await EvidencePhotoModel.create(
      evidence_id,
      result.secure_url,
      result.public_id,
      String(result.version)
    );

    // ── Mine a blockchain block that seals this upload action
    await BlockchainService.addBlock(
      evidence_id,
      req.user.id,
      req.user.id
    );

    return res.status(201).json({
      message: 'Photo uploaded to Cloudinary and sealed in blockchain.',
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

/**
 * GET /api/evidence/all
 * Returns all evidence records.
 * Role: Any authenticated user
 */
const getAllEvidence = async (req, res) => {
  try {
    let evidence;
    if (req.user.role === 'Admin') {
      evidence = await EvidenceModel.findAll();
    } else {
      evidence = await EvidenceModel.findVisibleToUser(req.user.id);
    }
    return res.status(200).json({ evidence });
  } catch (err) {
    console.error('Get all evidence error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { registerEvidence, uploadPhoto, getEvidence, getAllEvidence, lockEvidence };
