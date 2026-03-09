/**
 * ── Role-Based Access Control Middleware ───────────────────────
 * Returns an Express middleware that checks whether the
 * authenticated user's role is one of the allowed roles.
 *
 * Usage:  router.post('/route', authorize('Admin', 'Officer'), handler);
 */

const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // authMiddleware must run before this — req.user is expected to exist
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required.' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: `Access denied. Allowed roles: ${allowedRoles.join(', ')}`,
            });
        }

        next();
    };
};

module.exports = authorize;
