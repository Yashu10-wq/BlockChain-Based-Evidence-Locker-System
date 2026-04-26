-- ════════════════════════════════════════════════════════════════
-- Digital Evidence Locker — Database Schema
-- Run once against the 'evidence_locker' database.
-- ════════════════════════════════════════════════════════════════

-- ── Role Enum ──────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('Officer', 'Custodian', 'Admin', 'Forensic Technician');
  END IF;
END$$;

-- ── Users ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  NOT NULL UNIQUE,
  password_hash VARCHAR(255)  NOT NULL,
  role          user_role     NOT NULL DEFAULT 'Officer',
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Crimes ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crimes (
  id            SERIAL PRIMARY KEY,
  officer_id    INTEGER       REFERENCES users(id),
  title         VARCHAR(200)  NOT NULL,
  description   TEXT,
  created_at    TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Evidence ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence (
  id             SERIAL PRIMARY KEY,
  crime_id       INTEGER       REFERENCES crimes(id),
  title          VARCHAR(200)  NOT NULL,
  description    TEXT,
  location_found VARCHAR(255),
  officer_id     INTEGER       NOT NULL REFERENCES users(id),
  qr_code        TEXT,
  locked         BOOLEAN       NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- ── Evidence Photos ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS evidence_photos (
  id           SERIAL PRIMARY KEY,
  evidence_id          INTEGER      NOT NULL REFERENCES evidence(id) ON DELETE CASCADE,
  file_path            VARCHAR(500) NOT NULL,
  cloudinary_public_id VARCHAR(255),
  cloudinary_version   VARCHAR(100),
  uploaded_at          TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Custody Logs (SHA-256 hash chain) ──────────────────────────
CREATE TABLE IF NOT EXISTS custody_logs (
  id            SERIAL PRIMARY KEY,
  evidence_id   INTEGER      NOT NULL REFERENCES evidence(id),
  from_user     INTEGER      NOT NULL REFERENCES users(id),
  to_user       INTEGER      NOT NULL REFERENCES users(id),
  timestamp     TIMESTAMP    NOT NULL DEFAULT NOW(),
  previous_hash VARCHAR(64),
  current_hash  VARCHAR(64)  NOT NULL,
  block_index   INTEGER      NOT NULL DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'ACCEPTED'
);

-- ── Forensic Reports ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forensic_reports (
  id             SERIAL PRIMARY KEY,
  evidence_id    INTEGER      NOT NULL REFERENCES evidence(id),
  technician_id  INTEGER      NOT NULL REFERENCES users(id),
  report_file    VARCHAR(500) NOT NULL,
  uploaded_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- ── Audit Reports ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_reports (
  id              SERIAL PRIMARY KEY,
  admin_id        INTEGER NOT NULL REFERENCES users(id),
  report_summary  TEXT    NOT NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_evidence_officer   ON evidence(officer_id);
CREATE INDEX IF NOT EXISTS idx_custody_evidence   ON custody_logs(evidence_id);
CREATE INDEX IF NOT EXISTS idx_forensic_evidence  ON forensic_reports(evidence_id);
CREATE INDEX IF NOT EXISTS idx_photos_evidence    ON evidence_photos(evidence_id);
