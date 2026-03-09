/**
 * ── Forensic Routes ───────────────────────────────────────────
 * POST /api/forensic/upload-report         — upload report   (Forensic Technician)
 * GET  /api/forensic/reports/:evidence_id  — list reports    (Forensic Tech, Admin)
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const upload = require('../utils/uploadUtil');
const {
    uploadReport,
    getReports,
} = require('../controllers/forensicController');

const router = express.Router();

// All forensic routes require authentication
router.use(auth);

// ── Upload forensic report ─────────────────────────────────────
router.post(
    '/upload-report',
    authorize('Forensic Technician'),
    upload.single('report'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    uploadReport
);

// ── Get forensic reports for evidence ──────────────────────────
router.get(
    '/reports/:evidence_id',
    authorize('Forensic Technician', 'Admin'),
    getReports
);

module.exports = router;
