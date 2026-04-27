require('dotenv').config();
const pool = require('./config/db');
pool.query("SELECT timestamp FROM custody_logs LIMIT 5").then(res => { console.log(res.rows); pool.end(); });
