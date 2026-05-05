const CustodyLogModel = require('../models/custodyLogModel');
const EvidenceModel = require('../models/evidenceModel');
const { BlockchainService } = require('../services/blockchainService');

const initiateTransfer = async (req, res) => {
  try {
    const { evidence_id, to_user } = req.body;
    const fromUser = req.user.id;

    
    const evidence = await EvidenceModel.findById(evidence_id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found.' });
    }

    
    const chainResult = await BlockchainService.verifyChain(evidence_id);
    if (!chainResult.valid) {
      return res.status(403).json({
        error: 'BLOCKED: Evidence blockchain is corrupted. Custody transfers are locked for this item.',
        brokenAt: chainResult.brokenAt,
      });
    }

    
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

const acceptTransfer = async (req, res) => {
  try {
    const { evidence_id, qr_data } = req.body;
    const toUser = req.user.id;

    
    let parsed;
    try {
      parsed = JSON.parse(qr_data);
    } catch {
      return res.status(400).json({ error: 'Invalid QR data format.' });
    }

    if (String(parsed.evidence_id) !== String(evidence_id)) {
      return res.status(400).json({ error: 'QR code does not match the evidence ID.' });
    }

    
    const evidence = await EvidenceModel.findById(evidence_id);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found.' });
    }

    
    const chainResult = await BlockchainService.verifyChain(evidence_id);
    if (!chainResult.valid) {
      return res.status(403).json({
        error: 'BLOCKED: Evidence blockchain is corrupted. Custody transfers are locked for this item.',
        brokenAt: chainResult.brokenAt,
      });
    }

    
    const latest = await CustodyLogModel.getLatest(evidence_id);
    if (!latest) {
      return res.status(400).json({ error: 'No pending custody transfer found for this evidence.' });
    }

    const fromUser = latest.to_user;

    
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
