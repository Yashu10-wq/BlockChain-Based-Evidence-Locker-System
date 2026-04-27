/**
 * ── Audit Routes ──────────────────────────────────────────────
 * POST /api/audit/run                   — run full audit         (Admin)
 * GET  /api/audit/verify/:evidence_id   — verify single chain    (Admin)
 * GET  /api/audit/reports               — list audit reports     (Admin)
 * POST /api/audit/restore               — restore valid copy     (Admin)
 */

const express   = require('express');
const auth      = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const {
  runAudit,
  verifyChain,
  getAuditReports,
  restoreEvidence
} = require('../controllers/auditController');

const router = express.Router();

// All audit routes require authentication + Admin role
router.use(auth, authorize('Admin'));

router.post('/run', runAudit);
router.get('/verify/:evidence_id', verifyChain);
router.get('/reports', getAuditReports);
router.post('/restore', restoreEvidence);

module.exports = router;
