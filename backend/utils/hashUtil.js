/**
 * ── SHA-256 Hash Utility ───────────────────────────────────────
 * Generates a SHA-256 hex digest from a concatenated data string.
 * Used to build the tamper-detection hash chain in custody logs.
 */

const crypto = require('crypto');

/**
 * Generate a SHA-256 hash from the given data string.
 * @param {string} data - concatenated string to hash
 * @returns {string} 64-char lowercase hex digest
 */
const generateHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};

/**
 * Build the custody-chain hash from individual fields.
 * Formula: SHA-256( evidence_id + from_user + to_user + timestamp + previous_hash )
 */
const buildCustodyHash = (evidenceId, fromUser, toUser, timestamp, previousHash) => {
    const raw = `${evidenceId}${fromUser}${toUser}${timestamp}${previousHash || ''}`;
    return generateHash(raw);
};

module.exports = { generateHash, buildCustodyHash };
