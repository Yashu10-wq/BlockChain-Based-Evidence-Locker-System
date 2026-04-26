-- ════════════════════════════════════════════════════════════════
-- Phase 2 Migration — Run AFTER init.sql
-- ════════════════════════════════════════════════════════════════

-- ── Add block_index to custody_logs ────────────────────────────
ALTER TABLE custody_logs
  ADD COLUMN IF NOT EXISTS block_index INTEGER NOT NULL DEFAULT 0;

-- ── Add Cloudinary columns to evidence_photos ──────────────────
ALTER TABLE evidence_photos
  ADD COLUMN IF NOT EXISTS cloudinary_public_id VARCHAR(255),
  ADD COLUMN IF NOT EXISTS cloudinary_version   VARCHAR(100);
