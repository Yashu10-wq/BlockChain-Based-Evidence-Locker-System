/**
 * ── Validation Middleware ──────────────────────────────────────
 * Wraps express-validator's validationResult and returns a 400
 * response with structured errors when validation fails.
 */

const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Validation failed',
            details: errors.array().map((e) => ({
                field: e.path,
                message: e.msg,
            })),
        });
    }

    next();
};

module.exports = validate;
