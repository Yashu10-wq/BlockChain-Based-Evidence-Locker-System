const CrimeModel = require('../models/crimeModel');

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
