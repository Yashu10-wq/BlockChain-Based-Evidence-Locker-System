const CustodyLogModel = require('../models/custodyLogModel');
const EvidenceModel = require('../models/evidenceModel');
const AuditReportModel = require('../models/auditReportModel');
const { Block, BlockchainService } = require('../services/blockchainService');
const pool = require('../config/db');
const { generateQRCode } = require('../utils/qrUtil');

const runAudit = async (req, res) => {
  try {
    const adminId = req.user.id;
    const allEvidence = await EvidenceModel.findAll();

    let totalChecked = 0;
    let totalValid = 0;
    let totalInvalid = 0;
    const issues = [];

    for (const evidence of allEvidence) {
      const result = await BlockchainService.verifyChain(evidence.id);
      totalChecked++;

      if (result.valid) {
        totalValid++;
      } else {
        totalInvalid++;
        issues.push({
          evidence_id: evidence.id,
          title: evidence.title,
          brokenAt: result.brokenAt,
          totalBlocks: result.blocks.length,
        });
      }
    }

    const reportSummary = JSON.stringify({
      audited_at: new Date().toISOString(),
      evidence_items: allEvidence.length,
      total_checked: totalChecked,
      valid: totalValid,
      invalid: totalInvalid,
      issues,
    });

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

const restoreEvidence = async (req, res) => {
  const client = await pool.connect();
  try {
    const { evidence_id, broken_at } = req.body;
    if (!evidence_id || broken_at === undefined) {
      return res.status(400).json({ error: 'Missing evidence_id or broken_at.' });
    }

    await client.query('BEGIN');

    
    const { rows: evidenceRows } = await client.query('SELECT * FROM evidence WHERE id = $1', [evidence_id]);
    if (evidenceRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Evidence not found.' });
    }
    const oldEv = evidenceRows[0];

    
    const prefix = `[Restored from #${oldEv.id}] `;
    let newTitle = prefix + oldEv.title;
    if (newTitle.length > 200) newTitle = newTitle.substring(0, 200);
    const { rows: newEvRows } = await client.query(
      `INSERT INTO evidence (crime_id, title, description, location_found, officer_id, locked)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [oldEv.crime_id, newTitle, oldEv.description, oldEv.location_found, oldEv.officer_id, oldEv.locked]
    );
    const newEvId = newEvRows[0].id;

    
    const newQrCode = await generateQRCode(newEvId);
    await client.query('UPDATE evidence SET qr_code = $1 WHERE id = $2', [newQrCode, newEvId]);

    
    const { rows: photos } = await client.query('SELECT * FROM evidence_photos WHERE evidence_id = $1', [oldEv.id]);
    for (const photo of photos) {
      await client.query(
        `INSERT INTO evidence_photos (evidence_id, file_path, cloudinary_public_id, cloudinary_version)
         VALUES ($1, $2, $3, $4)`,
        [newEvId, photo.file_path, photo.cloudinary_public_id, photo.cloudinary_version]
      );
    }

    
    const { rows: reports } = await client.query('SELECT * FROM forensic_reports WHERE evidence_id = $1', [oldEv.id]);
    for (const report of reports) {
      await client.query(
        `INSERT INTO forensic_reports (evidence_id, technician_id, report_file, uploaded_at)
         VALUES ($1, $2, $3, $4)`,
        [newEvId, report.technician_id, report.report_file, report.uploaded_at]
      );
    }

    
    
    
    
    const { rows: logs } = await client.query(
      'SELECT * FROM custody_logs WHERE evidence_id = $1 AND block_index < $2 ORDER BY block_index ASC',
      [oldEv.id, broken_at]
    );

    let previousHash = '0';
    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];
      const timestamp = log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp;
      const data = {
        evidence_id: parseInt(newEvId, 10),
        from_user: parseInt(log.from_user, 10),
        to_user: parseInt(log.to_user, 10),
      };
      const block = new Block(i, timestamp, data, previousHash);

      await client.query(
        `INSERT INTO custody_logs (evidence_id, from_user, to_user, timestamp, previous_hash, current_hash, block_index, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [newEvId, log.from_user, log.to_user, timestamp,
          previousHash === '0' ? null : previousHash,
          block.hash, i, log.status]
      );

      previousHash = block.hash;
    }

    await client.query('COMMIT');

    return res.status(200).json({
      message: 'Restored successfully.',
      new_evidence_id: newEvId
    });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Restore evidence error:', err.stack || err.message);
    return res.status(500).json({ error: 'Internal server error.' });
  } finally {
    client.release();
  }
};

module.exports = { runAudit, verifyChain, getAuditReports, restoreEvidence };
