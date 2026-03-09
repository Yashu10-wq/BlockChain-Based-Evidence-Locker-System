/**
 * ═══════════════════════════════════════════════════════════════
 *  server.js — Application Entry Point
 * ═══════════════════════════════════════════════════════════════
 *
 * Loads environment variables, imports the Express app, and
 * starts listening on the configured port.
 */

// Load environment variables FIRST
require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

/**
 * Start the server after verifying the database connection.
 */
const startServer = async () => {
    try {
        // Verify DB connectivity
        await pool.query('SELECT NOW()');
        console.log('✅  Database connection verified.');

        app.listen(PORT, () => {
            console.log(`🚀  Evidence Locker API running on http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('❌  Failed to start server:', err.message);
        process.exit(1);
    }
};

startServer();
