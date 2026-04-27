/**
 * ═══════════════════════════════════════════════════════════════
 *  Blockchain Service — Private Ledger Engine
 * ═══════════════════════════════════════════════════════════════
 *
 * Implements a real Block-based chain where each custody transfer
 * is a Block containing: index, timestamp, data, previousHash.
 * The block's hash is computed via SHA-256 over all fields.
 *
 * Genesis blocks (first transfer for an evidence item) have
 * previousHash = "0".
 */

const crypto = require('crypto');
const CustodyLogModel = require('../models/custodyLogModel');

// ── Block Class ────────────────────────────────────────────────
class Block {
  /**
   * @param {number}  index        - position in the chain (0 = genesis)
   * @param {string}  timestamp    - ISO-8601 timestamp
   * @param {object}  data         - { evidence_id, from_user, to_user, [photo_version] }
   * @param {string}  previousHash - hash of the previous block ("0" for genesis)
   */
  constructor(index, timestamp, data, previousHash) {
    this.index        = index;
    this.timestamp    = timestamp;
    this.data         = data;
    this.previousHash = previousHash;
    this.hash         = this.computeHash();
  }

  /**
   * Compute SHA-256 hash over all block fields.
   * This is the core of tamper detection — changing any field
   * will produce a different hash.
   */
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

// ── Blockchain Service ─────────────────────────────────────────
const BlockchainService = {
  /**
   * Mine and persist a new block in the custody chain.
   *
   * @param {number} evidenceId
   * @param {number} fromUser
   * @param {number} toUser
   * @param {object} [extraData] - optional extra fields (e.g. photo_version)
   * @param {string} [status] - 'ACCEPTED' or 'PENDING'
   * @returns {object} the inserted custody_log row
   */
  addBlock: async (evidenceId, fromUser, toUser, extraData = {}, status = 'ACCEPTED') => {
    // 1. Fetch the latest block for this evidence
    const latest = await CustodyLogModel.getLatest(evidenceId);

    // 2. Determine index and previous hash
    const index        = latest ? (latest.block_index + 1) : 0;
    const previousHash = latest ? latest.current_hash : '0';

    // 3. Build block data payload
    // CRITICAL FIX: Ensure all IDs are strict Numbers. 
    // JSON.stringify() hashes Strings and Numbers differently!
    // req.body often passes them as strings, but Postgres returns integers.
    const timestamp = new Date().toISOString();
    const data = {
      evidence_id: parseInt(evidenceId, 10),
      from_user:   parseInt(fromUser, 10),
      to_user:     parseInt(toUser, 10),
      ...extraData,
    };

    // 4. Create the block and compute its hash
    const block = new Block(index, timestamp, data, previousHash);

    // 5. Persist to database
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

  /**
   * Verify the entire custody chain for an evidence item.
   * Re-computes every block's hash from scratch and compares
   * it to the stored hash.
   *
   * @param {number} evidenceId
   * @returns {{ valid: boolean, blocks: object[], brokenAt: number|null }}
   */
  verifyChain: async (evidenceId) => {
    const logs = await CustodyLogModel.findByEvidenceId(evidenceId);

    if (logs.length === 0) {
      return { valid: true, blocks: [], brokenAt: null };
    }

    let previousHash = '0';

    for (let i = 0; i < logs.length; i++) {
      const log = logs[i];

      // Re-create the block from stored fields
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

      // Compare re-computed hash vs stored hash
      if (block.hash !== log.current_hash) {
        return {
          valid:    false,
          blocks:   logs,
          brokenAt: i,
        };
      }

      // Verify linked previous_hash matches
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
