/**
 * ── Evidence Routes ───────────────────────────────────────────
 * POST /api/evidence/register       — register new evidence          (Officer)
 * POST /api/evidence/upload-photo   — upload evidence photo          (Officer)
 * GET  /api/evidence/:id            — view evidence + photos         (All authed)
 * POST /api/evidence/lock           — lock evidence record           (Officer)
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const upload = require('../utils/uploadUtil');
const {
    registerEvidence,
    uploadPhoto,
    getEvidence,
    lockEvidence,
} = require('../controllers/evidenceController');

const router = express.Router();

// All evidence routes require authentication
router.use(auth);

// ── Register evidence ──────────────────────────────────────────
router.post(
    '/register',
    authorize('Officer'),
    [
        body('title').notEmpty().withMessage('Title is required.'),
        body('description').optional(),
        body('location_found').notEmpty().withMessage('Location found is required.'),
    ],
    validate,
    registerEvidence
);

// ── Upload photo ───────────────────────────────────────────────
router.post(
    '/upload-photo',
    authorize('Officer'),
    upload.single('photo'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    uploadPhoto
);

// ── Get evidence by ID ─────────────────────────────────────────
router.get('/:id', getEvidence);

// ── Lock evidence ──────────────────────────────────────────────
router.post(
    '/lock',
    authorize('Officer'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    lockEvidence
);

module.exports = router;
