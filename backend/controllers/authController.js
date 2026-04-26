/**
 * ── Auth Controller ───────────────────────────────────────────
 * Handles user registration and login.
 * Passwords are hashed with bcrypt; JWTs are returned on success.
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// ── Helper: sign a JWT for the given user ──────────────────────
const signToken = (user) => {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );
};

/**
 * POST /api/auth/register
 * Body: { name, email, password, role }
 */
const register = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const existing = await UserModel.findByEmail(email);
        if (existing) {
            return res.status(409).json({ error: 'Email already registered.' });
        }

        // Hash password with bcrypt (12 salt rounds)
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user
        const user = await UserModel.create(name, email, passwordHash, role);

        // Return JWT
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

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
const login = async (req, res) => {
    try {
        // Seed Check: Check if database has any users
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

        // 1. Look up user
        const user = await UserModel.findByEmail(email);
        if (!user) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // 2. Compare passwords
        const match = await bcrypt.compare(password, user.password_hash);
        if (!match) {
            return res.status(401).json({ error: 'Invalid email or password.' });
        }

        // 3. Return JWT
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

/**
 * GET /api/auth/users
 * Returns a list of all users.
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await UserModel.findAllUsers();
        return res.status(200).json({ users });
    } catch (err) {
        console.error('Get all users error:', err.stack || err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { register, login, getAllUsers };
