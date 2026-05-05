const pool = require('../config/db');

const UserModel = {
    


    create: async (name, email, passwordHash, role) => {
        const { rows } = await pool.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name, email, passwordHash, role]
        );
        return rows[0];
    },

    


    findByEmail: async (email) => {
        const { rows } = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );
        return rows[0] || null;
    },

    


    findById: async (id) => {
        const { rows } = await pool.query(
            'SELECT id, name, email, role, created_at FROM users WHERE id = $1',
            [id]
        );
        return rows[0] || null;
    },

    


    findAllUsers: async () => {
        const { rows } = await pool.query(
            'SELECT id, name, email, role FROM users ORDER BY name ASC'
        );
        return rows;
    },

    


    countUsers: async () => {
        try {
            const { rows } = await pool.query('SELECT COUNT(*) FROM users');
            return parseInt(rows[0].count, 10);
        } catch (error) {
            
            return -1;
        }
    },
};

module.exports = UserModel;
