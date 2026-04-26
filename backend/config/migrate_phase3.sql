-- ════════════════════════════════════════════════════════════════
-- Phase 3 Migration — Run AFTER phase 2
-- Implements Crime workflow and Custody status
-- ════════════════════════════════════════════════════════════════

-- 1. Create Crimes Table
CREATE TABLE IF NOT EXISTS crimes (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2. Add status to custody_logs (PENDING vs ACCEPTED)
ALTER TABLE custody_logs
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACCEPTED';

-- 3. Link Evidence to Crimes
ALTER TABLE evidence
  ADD COLUMN IF NOT EXISTS crime_id INTEGER REFERENCES crimes(id);

-- If you have existing evidence without crimes, you can create a default crime or leave it null.
-- Creating a default "Legacy Crime" for existing evidence:
INSERT INTO crimes (title, description) 
VALUES ('Legacy Evidence', 'Automatically generated for evidence existing prior to Phase 3.')
ON CONFLICT DO NOTHING;

-- Assign existing evidence to the Legacy Crime (ID 1 assuming it's the first)
UPDATE evidence SET crime_id = (SELECT id FROM crimes LIMIT 1) WHERE crime_id IS NULL;
