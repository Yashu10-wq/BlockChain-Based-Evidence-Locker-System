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


router.use(auth);


router.post(
    '/initiate',
    authorize('Officer', 'Custodian', 'Admin'),
    [
        body('evidence_id').notEmpty().withMessage('Evidence ID is required.'),
        body('to_user').notEmpty().withMessage('Recipient user ID is required.'),
    ],
    validate,
    initiateTransfer
);


router.post(
    '/accept',
    authorize('Custodian', 'Officer', 'Forensic Technician'),
    [
        body('evidence_id').notEmpty().withMessage('Evidence ID is required.'),
        body('qr_data').notEmpty().withMessage('QR data is required.'),
    ],
    validate,
    acceptTransfer
);


router.get('/history/:evidence_id', authorize('Admin'), getCustodyHistory);

module.exports = router;
