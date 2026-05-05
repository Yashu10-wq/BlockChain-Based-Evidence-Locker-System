const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validationMiddleware');
const { register, login, getAllUsers, forgotPassword, resetPassword } = require('../controllers/authController');

const router = express.Router();


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

const forgotPasswordRules = [
    body('email').isEmail().withMessage('Valid email is required.'),
];

const resetPasswordRules = [
    body('email').isEmail().withMessage('Valid email is required.'),
    body('otp').notEmpty().withMessage('OTP is required.'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
];


router.post('/register', registerRules, validate, register);
router.post('/login', loginRules, validate, login);
router.post('/forgot-password', forgotPasswordRules, validate, forgotPassword);
router.post('/reset-password', resetPasswordRules, validate, resetPassword);
router.get('/users', getAllUsers);

module.exports = router;
