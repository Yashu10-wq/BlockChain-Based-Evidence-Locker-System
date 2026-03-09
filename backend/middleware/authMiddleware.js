/**
 * ── JWT Authentication Middleware ──────────────────────────────
 * Extracts the Bearer token from the Authorization header,
 * verifies it against JWT_SECRET, and attaches the decoded
 * user payload to req.user.
 */

const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
    // 1. Read the Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        // 2. Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3. Attach user info to request object
        req.user = decoded; // { id, email, role, iat, exp }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token.' });
    }
};

module.exports = authMiddleware;
