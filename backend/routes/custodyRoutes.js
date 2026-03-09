/**
 * ── Custody Routes ────────────────────────────────────────────
 * POST /api/custody/initiate              — initiate transfer    (Officer)
 * POST /api/custody/accept                — accept via QR scan   (Custodian)
 * GET  /api/custody/history/:evidence_id  — view custody chain   (All authed)
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    initiateTransfer,
    acceptTransfer,
    getCustodyHistory,
} = require('../controllers/custodyController');

const router = express.Router();

// All custody routes require authentication
router.use(auth);

// ── Initiate transfer ──────────────────────────────────────────
router.post(
    '/initiate',
    authorize('Officer'),
    [
        body('evidence_id').notEmpty().withMessage('Evidence ID is required.'),
        body('to_user').notEmpty().withMessage('Recipient user ID is required.'),
    ],
    validate,
    initiateTransfer
);

// ── Accept transfer (QR scan) ──────────────────────────────────
router.post(
    '/accept',
    authorize('Custodian'),
    [
        body('evidence_id').notEmpty().withMessage('Evidence ID is required.'),
        body('qr_data').notEmpty().withMessage('QR data is required.'),
    ],
    validate,
    acceptTransfer
);

// ── Get full custody history ───────────────────────────────────
router.get('/history/:evidence_id', getCustodyHistory);

module.exports = router;
