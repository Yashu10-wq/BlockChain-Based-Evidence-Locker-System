const crypto = require('crypto');



const generateHash = (data) => {
    return crypto.createHash('sha256').update(data).digest('hex');
};



const buildCustodyHash = (evidenceId, fromUser, toUser, timestamp, previousHash) => {
    const raw = `${evidenceId}${fromUser}${toUser}${timestamp}${previousHash || ''}`;
    return generateHash(raw);
};

module.exports = { generateHash, buildCustodyHash };
