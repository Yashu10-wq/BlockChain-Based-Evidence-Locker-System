/**
 * ── Auth Routes ───────────────────────────────────────────────
 * POST /api/auth/register  — create a new user
 * POST /api/auth/login     — authenticate and receive JWT
 */

const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const { register, login, getAllUsers } = require('../controllers/authController');

const router = express.Router();

// ── Validation rules ───────────────────────────────────────────
const registerRules = [
    body('name').notEmpty().withMessage('Name is required.'),
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters.'),
    body('role')
        .isIn(['Officer', 'Custodian', 'Admin', 'Forensic Technician'])
        .withMessage('Role must be Officer, Custodian, Admin, or Forensic Technician.'),
];

const loginRules = [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
];

// ── Routes ─────────────────────────────────────────────────────
router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.get('/users', getAllUsers);

module.exports = router;
