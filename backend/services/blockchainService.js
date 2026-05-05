const crypto = require('crypto');
const CustodyLogModel = require('../models/custodyLogModel');

class Block {
  

  constructor(index, timestamp, data, previousHash) {
    this.index        = index;
    this.timestamp    = timestamp;
    this.data         = data;
    this.previousHash = previousHash;
    this.hash         = this.computeHash();
  }

  

  computeHash() {
    const payload = JSON.stringify({
      index:        this.index,
      timestamp:    this.timestamp,
      data:         this.data,
      previousHash: this.previousHash,
    });
    return crypto.createHash('sha256').update(payload).digest('hex');
  }
}

const BlockchainService = {
  

  addBlock: async (evidenceId, fromUser, toUser, extraData = {}, status = 'ACCEPTED') => {
    
    const latest = await CustodyLogModel.getLatest(evidenceId);

    
    const index        = latest ? (latest.block_index + 1) : 0;
    const previousHash = latest ? latest.current_hash : '0';

    
    
    
    
    const timestamp = new Date().toISOString();
    const data = {
      evidence_id: parseInt(evidenceId, 10),
      from_user:   parseInt(fromUser, 10),
      to_user:     parseInt(toUser, 10),
      ...extraData,
    };

    
    const block = new Block(index, timestamp, data, previousHash);

    
    const log = await CustodyLogModel.createWithIndex(
      evidenceId,
      fromUser,
      toUser,
      previousHash === '0' ? null : previousHash,
      block.hash,
      index,
      status,
      timestamp
    );

    return log;
  },

  

  verifyChain: async (evidenceId) => {
    const logs = await CustodyLogModel.findByEvidenceId(evidenceId);

    if (logs.length === 0) {
      return { valid: true, blocks: [], brokenAt: null };
    }

    let previousHash = '0';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      
      const data = {
        evidence_id: log.evidence_id,
        from_user:   log.from_user,
        to_user:     log.to_user,
      };

      const block = new Block(
        log.block_index,
        log.timestamp instanceof Date ? log.timestamp.toISOString() : log.timestamp,
        data,
        previousHash
      );

      
      if (block.hash !== log.current_hash) {
        return {
          valid:    false,
          blocks:   logs,
          brokenAt: i,
        };
      }

      
      const storedPrev = log.previous_hash || '0';
      if (storedPrev !== previousHash) {
        return {
          valid:    false,
          blocks:   logs,
          brokenAt: i,
        };
      }

      previousHash = log.current_hash;
    }

    return { valid: true, blocks: logs, brokenAt: null };
  },
};

module.exports = { Block, BlockchainService };
