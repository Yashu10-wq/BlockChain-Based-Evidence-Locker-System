const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');
const nodemailer = require('nodemailer');
const pool = require('../config/db');

const signToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;


        const existing = await UserModel.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }


        const passwordHash = await bcrypt.hash(password, 12);


        const user = await UserModel.create(name, email, passwordHash, role);


        const token = signToken(user);
        return res.status(201).json({
            message: 'User registered successfully.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Register error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const login = async (req, res) => {
    try {

        const userCount = await UserModel.countUsers();
        if (userCount === -1) {
            console.warn("⚠️ Could not query users table. Database might not be initialized.");
            return res.status(500).json({ error: 'Database not initialized. Please run the seed script: node config/seed.js' });
        } else if (userCount === 0) {
            console.warn("⚠️ No users found in the database. Please run the seed script: node config/seed.js");
            return res.status(500).json({ error: 'System not initialized. Please run the seed script.' });
        }

        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required.' });
        }


        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }


        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }


        const token = signToken(user);
        return res.status(200).json({
            message: 'Login successful.',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        });
    } catch (err) {
        console.error('Login error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.findAllUsers();
        return res.status(200).json({ users });
    } catch (err) {
        console.error('Get all users error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required.' });

        const user = await UserModel.findByEmail(email);
        if (!user) {

            return res.status(200).json({ message: 'If the email exists, an OTP was sent.' });
        }


        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await pool.query(
            'INSERT INTO otps (user_email, otp_code, expires_at) VALUES ($1, $2, $3)',
            [email, otp, expiresAt]
        );


        console.log('Sending OTP email to:', email, 'from:', process.env.EMAIL_USER);
        const transporter = nodemailer.createTransport({
            host: 'smtp-relay.brevo.com',
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
            family: 4,

        });

        const mailOptions = {
            from: `"Evidence Locker System" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: 'Password Reset OTP',
            text: `Your password reset OTP is: ${otp}\n\nIt expires in 15 minutes.`,
            html: `<h3>Password Reset</h3><p>Your password reset OTP is: <strong>${otp}</strong></p><p>It expires in 15 minutes.</p>`
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ message: 'If the email exists, an OTP was sent.' });
    } catch (err) {
        console.error('Forgot password error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;
        if (!email || !otp || !newPassword) {
            return res.status(400).json({ error: 'Missing required fields.' });
        }


        const { rows } = await pool.query(
            'SELECT * FROM otps WHERE user_email = $1 AND otp_code = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
            [email, otp]
        );

        if (rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired OTP.' });
        }


        const passwordHash = await bcrypt.hash(newPassword, 12);
        await pool.query('UPDATE users SET password_hash = $1 WHERE email = $2', [passwordHash, email]);


        await pool.query('DELETE FROM otps WHERE user_email = $1', [email]);

        return res.status(200).json({ message: 'Password reset successful.' });
    } catch (err) {
        console.error('Reset password error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { register, login, getAllUsers, forgotPassword, resetPassword };
