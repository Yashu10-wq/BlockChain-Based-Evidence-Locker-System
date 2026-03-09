/**
 * ── Custody Controller ────────────────────────────────────────
 * Manages custody transfer initiation, acceptance (with QR scan),
 * and viewing the full custody history for an evidence item.
 *
 * Each transfer appends a SHA-256 hash-chain link for tamper detection.
 */

const CustodyLogModel = require('../models/custodyLogModel');
const EvidenceModel = require('../models/evidenceModel');
const { buildCustodyHash } = require('../utils/hashUtil');

/**
 * POST /api/custody/initiate
 * Body: { evidence_id, to_user }
 * Role: Officer
 *
 * Creates a new custody log entry where the officer transfers
 * evidence to another user (e.g. a Custodian).
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

        // Get the latest custody log to read the previous hash
        const latest = await CustodyLogModel.getLatest(evidence_id);
        const previousHash = latest ? latest.current_hash : null;

        // Build the current timestamp
        const timestamp = new Date().toISOString();

        // Build the SHA-256 hash for this chain link
        const currentHash = buildCustodyHash(
            evidence_id, fromUser, to_user, timestamp, previousHash
        );

        // Insert custody log
        const log = await CustodyLogModel.create(
            evidence_id, fromUser, to_user, previousHash, currentHash
        );

        return res.status(201).json({
            message: 'Custody transfer initiated.',
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
 * Role: Custodian
 *
 * Custodian scans the QR code to accept custody of the evidence.
 * The QR data is verified against the evidence ID, then a new
 * hash-chain link is appended confirming receipt.
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

        // 3. Get latest custody log to find the from_user and previous hash
        const latest = await CustodyLogModel.getLatest(evidence_id);
        if (!latest) {
            return res.status(400).json({ error: 'No pending custody transfer found for this evidence.' });
        }

        const fromUser = latest.to_user; // the person who should hand it over
        const previousHash = latest.current_hash;
        const timestamp = new Date().toISOString();

        // 4. Build new hash-chain link
        const currentHash = buildCustodyHash(
            evidence_id, fromUser, toUser, timestamp, previousHash
        );

        // 5. Append log
        const log = await CustodyLogModel.create(
            evidence_id, fromUser, toUser, previousHash, currentHash
        );

        return res.status(200).json({
            message: 'Custody transfer accepted.',
            custody_log: log,
        });
    } catch (err) {
        console.error('Accept transfer error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/custody/history/:evidence_id
 * Returns the full custody chain for a given evidence item.
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
