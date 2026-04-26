-- ════════════════════════════════════════════════════════════════
-- Phase 4 Migration — Run AFTER phase 3
-- Fixes Crime folder visibility by tracking the creator
-- ════════════════════════════════════════════════════════════════

-- 1. Add officer_id to crimes
ALTER TABLE crimes
  ADD COLUMN IF NOT EXISTS officer_id INTEGER REFERENCES users(id);

-- 2. For any existing crimes that have no officer_id, assign them to the first Admin or user
UPDATE crimes SET officer_id = (SELECT id FROM users LIMIT 1) WHERE officer_id IS NULL;
