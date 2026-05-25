/**
 * ── Hacker Routes ─────────────────────────────────────────────
 * POST /api/hacker/tamper — Simulate database tampering
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { tamperEvidence } = require('../controllers/hackerController');

const router = express.Router();

// Require authentication and the 'Hacker' role
router.use(auth);
router.use(authorize('Hacker', 'Admin')); // Allowing Admin for testing ease, though purely Hacker is fine

router.post(
    '/tamper',
    [
        body('evidence_id').notEmpty().withMessage('Evidence ID is required.'),
    ],
    validate,
    tamperEvidence
);

module.exports = router;
