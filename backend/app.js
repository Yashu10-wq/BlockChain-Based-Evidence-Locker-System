const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const app = express();


app.use(helmet());
app.use(cors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


const authRoutes = require('./routes/authRoutes');
const crimeRoutes = require('./routes/crimeRoutes');
const evidenceRoutes = require('./routes/evidenceRoutes');
const custodyRoutes = require('./routes/custodyRoutes');
const forensicRoutes = require('./routes/forensicRoutes');
const auditRoutes = require('./routes/auditRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/crimes', crimeRoutes);
app.use('/api/evidence', evidenceRoutes);
app.use('/api/custody', custodyRoutes);
app.use('/api/forensic', forensicRoutes);
app.use('/api/audit', auditRoutes);


app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});


app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found.' });
});


app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err.message);
    res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;
