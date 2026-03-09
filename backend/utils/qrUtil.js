/**
 * ── QR Code Utility ────────────────────────────────────────────
 * Generates a QR code data-URL for a given evidence ID.
 * The QR encodes a JSON payload so scanners can parse it easily.
 */

const QRCode = require('qrcode');

/**
 * Generate a base-64 data URL QR code for an evidence record.
 * @param {number|string} evidenceId
 * @returns {Promise<string>} data URL (image/png;base64,…)
 */
const generateQRCode = async (evidenceId) => {
    const payload = JSON.stringify({ evidence_id: evidenceId });
    const dataUrl = await QRCode.toDataURL(payload, { width: 300 });
    return dataUrl;
};

module.exports = { generateQRCode };
