/**
 * ── Crime Controller ──────────────────────────────────────────
 * Handles crime registration and retrieval.
 */

const CrimeModel = require('../models/crimeModel');

/**
 * POST /api/crimes/register
 * Body: { title, description }
 * Role: Officer, Admin
 */
const registerCrime = async (req, res) => {
    try {
        const { title, description } = req.body;
        const crime = await CrimeModel.create(title, description, req.user.id);

        return res.status(201).json({
            message: 'Crime registered successfully.',
            crime,
        });
    } catch (err) {
        console.error('Register crime error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/crimes/all
 * Returns all crimes. Filtered based on user role and custody.
 * Role: Any authenticated user
 */
const getAllCrimes = async (req, res) => {
    try {
        let crimes;
        if (req.user.role === 'Admin') {
            crimes = await CrimeModel.findAll();
        } else {
            crimes = await CrimeModel.findVisibleToUser(req.user.id);
        }
        return res.status(200).json({ crimes });
    } catch (err) {
        console.error('Get all crimes error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

/**
 * GET /api/crimes/:id
 * Returns a single crime.
 */
const getCrime = async (req, res) => {
    try {
        const crime = await CrimeModel.findById(req.params.id);
        if (!crime) {
            return res.status(404).json({ error: 'Crime not found.' });
        }
        return res.status(200).json({ crime });
    } catch (err) {
        console.error('Get crime error:', err.message);
        return res.status(500).json({ error: 'Internal server error.' });
    }
};

module.exports = { registerCrime, getAllCrimes, getCrime };
