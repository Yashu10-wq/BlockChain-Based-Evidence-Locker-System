/**
 * ── Custody Controller ────────────────────────────────────────
 * Manages custody transfer initiation, acceptance (with QR scan),
 * and viewing the full custody history for an evidence item.
 *
 * Phase 2: Uses BlockchainService to create real Block objects
 * with index, timestamp, data, and SHA-256 hash chaining.
 */

const CustodyLogModel = require('../models/custodyLogModel');
const EvidenceModel   = require('../models/evidenceModel');
const { BlockchainService } = require('../services/blockchainService');

/**
 * POST /api/custody/initiate
 * Body: { evidence_id, to_user }
 * Role: Officer
 *
 * Creates a new block in the custody chain where the officer
 * transfers evidence to another user.
 */
const initiateTransfer = async (req, res) => {
  try {
    const { evidence_id, to_user } = req.body;
    const fromUser = req.user.id;

    // Verify evidence exists
    const evidence = await EvidenceModel.findById(evidence_id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found.' });
    }

    // Verify blockchain integrity before allowing transfer
    const chainResult = await BlockchainService.verifyChain(evidence_id);
    if (!chainResult.valid) {
      return res.status(403).json({ 
        error: 'BLOCKED: Evidence blockchain is corrupted. Custody transfers are locked for this item.',
        brokenAt: chainResult.brokenAt,
      });
    }

    // Mine a new block via the Blockchain Service with PENDING status
    const log = await BlockchainService.addBlock(evidence_id, fromUser, to_user, {}, 'PENDING');

    return res.status(201).json({
      message: 'Custody transfer initiated — block mined.',
      custody_log: log,
    });
  } catch (err) {
    console.error('Initiate transfer error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * POST /api/custody/accept
 * Body: { evidence_id, qr_data }
 * Role: Custodian, Officer
 *
 * The receiver scans the QR code to accept custody.
 * A new confirmation block is mined into the chain.
 */
const acceptTransfer = async (req, res) => {
  try {
    const { evidence_id, qr_data } = req.body;
    const toUser = req.user.id;

    // 1. Parse and verify QR data
    let parsed;
    try {
      parsed = JSON.parse(qr_data);
    } catch {
      return res.status(400).json({ error: 'Invalid QR data format.' });
    }

    if (String(parsed.evidence_id) !== String(evidence_id)) {
      return res.status(400).json({ error: 'QR code does not match the evidence ID.' });
    }

    // 2. Verify evidence exists
    const evidence = await EvidenceModel.findById(evidence_id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found.' });
    }

    // 2b. Verify blockchain integrity before allowing acceptance
    const chainResult = await BlockchainService.verifyChain(evidence_id);
    if (!chainResult.valid) {
      return res.status(403).json({ 
        error: 'BLOCKED: Evidence blockchain is corrupted. Custody transfers are locked for this item.',
        brokenAt: chainResult.brokenAt,
      });
    }

    // 3. Find the latest block to know who is handing over
    const latest = await CustodyLogModel.getLatest(evidence_id);
    if (!latest) {
      return res.status(400).json({ error: 'No pending custody transfer found for this evidence.' });
    }

    const fromUser = latest.to_user;

    // 4. Mine an acceptance block
    const log = await BlockchainService.addBlock(evidence_id, fromUser, toUser, {}, 'ACCEPTED');

    return res.status(200).json({
      message: 'Custody transfer accepted — block mined.',
      custody_log: log,
    });
  } catch (err) {
    console.error('Accept transfer error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

/**
 * GET /api/custody/history/:evidence_id
 * Returns the full custody blockchain for a given evidence item.
 * Role: Any authenticated user
 */
const getCustodyHistory = async (req, res) => {
  try {
    const { evidence_id } = req.params;
    const logs = await CustodyLogModel.findByEvidenceId(evidence_id);
    return res.status(200).json({ evidence_id, custody_chain: logs });
  } catch (err) {
    console.error('Get custody history error:', err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = { initiateTransfer, acceptTransfer, getCustodyHistory };
