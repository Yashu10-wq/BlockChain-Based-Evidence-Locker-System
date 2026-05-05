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
    getAllEvidence,
    lockEvidence,
} = require('../controllers/evidenceController');

const router = express.Router();


router.use(auth);


router.post(
    '/register',
    authorize('Officer', 'Admin'),
    [
        body('crime_id').notEmpty().withMessage('Crime ID is required.'),
        body('title').notEmpty().withMessage('Title is required.'),
        body('description').optional(),
        body('location_found').notEmpty().withMessage('Location found is required.'),
    ],
    validate,
    registerEvidence
);


router.post(
    '/upload-photo',
    authorize('Officer', 'Admin'),
    upload.single('photo'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    uploadPhoto
);


router.get('/all', getAllEvidence);


router.get('/:id', getEvidence);


router.post(
    '/lock',
    authorize('Officer', 'Admin'),
    [body('evidence_id').notEmpty().withMessage('Evidence ID is required.')],
    validate,
    lockEvidence
);

module.exports = router;
