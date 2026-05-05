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


router.use(auth);


router.post(
    '/upload-report',
    authorize('Forensic Technician'),
    upload.single('report'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    uploadReport
);


router.get(
    '/reports/:evidence_id',
    authorize('Forensic Technician', 'Admin', 'Officer', 'Custodian'),
    getReports
);

module.exports = router;
