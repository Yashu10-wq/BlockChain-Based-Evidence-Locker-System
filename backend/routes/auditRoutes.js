/**
 * ── Audit Routes ──────────────────────────────────────────────
 * POST /api/audit/run       — run integrity audit   (Admin)
 * GET  /api/audit/reports   — list audit reports     (Admin)
 */

const express = require('express');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
    runAudit,
    getAuditReports,
} = require('../controllers/auditController');

const router = express.Router();

// All audit routes require authentication + Admin role
router.use(auth, authorize('Admin'));

// ── Run audit ──────────────────────────────────────────────────
router.post('/run', runAudit);

// ── Get audit reports ──────────────────────────────────────────
router.get('/reports', getAuditReports);

module.exports = router;
