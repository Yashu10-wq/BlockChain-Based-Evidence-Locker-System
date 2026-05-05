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

router.use(auth, authorize('Admin'));

router.post('/run', runAudit);
router.get('/verify/:evidence_id', verifyChain);
router.get('/reports', getAuditReports);
router.post('/restore', restoreEvidence);

module.exports = router;
