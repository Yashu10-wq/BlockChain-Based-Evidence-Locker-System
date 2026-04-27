require('dotenv').config();
const { BlockchainService } = require('./config/../services/blockchainService');
const CustodyLogModel = require('./config/../models/custodyLogModel');
const EvidenceModel = require('./config/../models/evidenceModel');

async function test() {
  try {
    const ev = await EvidenceModel.create(1, "Test Knife", "A knife", "Mall", 1, "testqr");
    console.log("Created evidence", ev.id);
    
    // Genesis block (registration) - wait, registration doesn't add a block.
    // Let's add a PENDING block
    const b1 = await BlockchainService.addBlock(ev.id, 1, 2, {}, 'PENDING');
    console.log("Added PENDING block", b1.id);
    
    // Check verify
    let v1 = await BlockchainService.verifyChain(ev.id);
    console.log("Verify after PENDING:", v1.valid);
    if (!v1.valid) {
      console.log("BROKEN AT:", v1.brokenAt);
    }
    
    // ACCEPTED block
    const b2 = await BlockchainService.addBlock(ev.id, 1, 2, {}, 'ACCEPTED');
    console.log("Added ACCEPTED block", b2.id);
    
    // Check verify
    let v2 = await BlockchainService.verifyChain(ev.id);
    console.log("Verify after ACCEPTED:", v2.valid);
    if (!v2.valid) {
      console.log("BROKEN AT:", v2.brokenAt);
      
      // Let's debug why it broke
      const logs = await CustodyLogModel.findByEvidenceId(ev.id);
      const brokenLog = logs[v2.brokenAt];
      console.log("\n--- DEBUGGING BROKEN BLOCK ---");
      console.log("Stored Hash: ", brokenLog.current_hash);
      
      const { Block } = require('./config/../services/blockchainService');
      
      const data = {
        evidence_id: brokenLog.evidence_id,
        from_user:   brokenLog.from_user,
        to_user:     brokenLog.to_user,
      };

      const block = new Block(
        brokenLog.block_index,
        brokenLog.timestamp instanceof Date ? brokenLog.timestamp.toISOString() : brokenLog.timestamp,
        data,
        brokenLog.previous_hash || '0'
      );
      
      console.log("Recomputed:  ", block.hash);
      console.log("Recomputed Timestamp: ", block.timestamp);
      console.log("Stored Timestamp:     ", brokenLog.timestamp.toISOString());
    }
    
  } catch(e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}

test();
