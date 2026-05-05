const QRCode = require('qrcode');



const generateQRCode = async (evidenceId) => {
    const payload = JSON.stringify({ evidence_id: evidenceId });
    const dataUrl = await QRCode.toDataURL(payload, { width: 300 });
    return dataUrl;
};

module.exports = { generateQRCode };
