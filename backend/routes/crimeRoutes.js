/**
 * ── Crime Routes ───────────────────────────────────────────────
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const auth = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');
const { registerCrime, getAllCrimes, getCrime } = require('../controllers/crimeController');

const router = express.Router();

router.use(auth);

router.post(
    '/register',
    authorize('Officer', 'Admin'),
    [
        body('title').notEmpty().withMessage('Title is required.'),
        body('description').optional(),
    ],
    validate,
    registerCrime
);

router.get('/all', getAllCrimes);
router.get('/:id', getCrime);

module.exports = router;
