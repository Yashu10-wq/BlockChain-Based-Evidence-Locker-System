/**
 * ── User Model ────────────────────────────────────────────────
 * Thin DB-access layer for the `users` table.
 */

const pool = require('../config/db');

const UserModel = {
    /**
     * Create a new user.
     * @returns {object} the created user row
     */
    create: async (name, email, passwordHash, role) => {
        const { rows } = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash, role]
        );
        return rows[0];
    },

    /**
     * Find a user by email (used during login).
     */
    findByEmail: async (email) => {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return rows[0] || null;
    },

    /**
     * Find a user by primary key.
     */
    findById: async (id) => {
        const { rows } = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },
};

module.exports = UserModel;
