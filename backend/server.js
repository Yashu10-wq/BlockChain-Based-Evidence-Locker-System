require('dotenv').config();

const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;



const startServer = async () => {
    try {
        
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
