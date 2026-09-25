-- =====================================================================
-- Gig — PostgreSQL schema
-- Matched 1:1 to the TypeScript contracts in frontend/src/types.
-- Prisma (backend/prisma/schema.prisma) mirrors this file; this copy is
-- the plain-SQL source of truth for anyone running Postgres without the ORM.
-- =====================================================================

-- ---------------------------------------------------------------------
-- Auth: OTP login, one profile row per mobile number
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mobile        VARCHAR(20) UNIQUE NOT NULL,          -- E.164, e.g. +919820000000
  name          VARCHAR(120),
  email         VARCHAR(160),
  pan           VARCHAR(10) UNIQUE,
  gstin         VARCHAR(15) UNIQUE,                   -- nullable until they register
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Core domain: platforms + self-reported income records
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platforms (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(120) NOT NULL,
  category    VARCHAR(40)  NOT NULL,
  has_records BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS income_records (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  platform_id           UUID NOT NULL REFERENCES platforms(id) ON DELETE CASCADE,
  income_amount         NUMERIC(14,2) NOT NULL CHECK (income_amount >= 0),
  corresponding_tax     NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (corresponding_tax >= 0),
  tax_deduction_source  VARCHAR(20) NOT NULL,         -- none | platform_tds | client_tds
  payment_status        VARCHAR(20) NOT NULL,         -- paid | not_paid | partially_paid
  receipt_confirmed     BOOLEAN     NOT NULL DEFAULT FALSE,
  receipt_file_name     VARCHAR(255),
  work_start_date       DATE        NOT NULL,
  work_end_date         DATE        NOT NULL,
  tax_pay_deadline      DATE        NOT NULL,
  client_name           VARCHAR(160),
  client_email          VARCHAR(160),
  notes                 TEXT,
  source                VARCHAR(20) NOT NULL DEFAULT 'manual',  -- manual | ocr_import
  statement_id          UUID,                                  -- set when imported from a bank statement
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Bank statements: uploaded files + their OCR-extracted line items
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bank_statements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name       VARCHAR(255) NOT NULL,
  mime_type       VARCHAR(80)  NOT NULL,
  size_bytes      INTEGER      NOT NULL CHECK (size_bytes >= 0),
  ocr_status      VARCHAR(20)  NOT NULL DEFAULT 'pending', -- pending | processing | done | failed
  error_message   TEXT,
  uploaded_at     TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- One row per candidate transaction the OCR pass proposes; the user accepts
-- or rejects each one, and accepted rows become income_records.
CREATE TABLE IF NOT EXISTS statement_transactions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id   UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  raw_text       TEXT,                                  -- the line as OCR saw it
  amount         NUMERIC(14,2) NOT NULL,
  direction      VARCHAR(4)  NOT NULL CHECK (direction IN ('in','out')), -- credit = income candidate
  txn_date       DATE,
  narration      TEXT,
  counterparty   VARCHAR(160),
  is_accepted    BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ITR filing: one row per submission
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS itr_filings (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assessment_year         VARCHAR(10) NOT NULL,          -- e.g. "2026-27"
  regime                  VARCHAR(4)  NOT NULL,          -- old | new
  computation             JSONB       NOT NULL,          -- full TaxComputation snapshot
  income_sources          JSONB       NOT NULL,          -- per-platform aggregates
  status                  VARCHAR(20) NOT NULL DEFAULT 'submitted', -- submitted | acknowledged
  acknowledgement_number  VARCHAR(40) NOT NULL,
  filed_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Calendar: Google OAuth tokens + ITR deadline reminders
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS calendar_tokens (
  user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  access_token    TEXT        NOT NULL,
  refresh_token   TEXT,
  expires_at      TIMESTAMPTZ NOT NULL,
  scope           TEXT,
  connected_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deadline_reminders (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label         VARCHAR(160) NOT NULL,                 -- "ITR-4 filing deadline"
  due_date      DATE        NOT NULL,
  event_id      VARCHAR(120),                          -- Google Calendar event id, once synced
  synced_at     TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, label, due_date)                    -- idempotent reminder creation
);

-- ---------------------------------------------------------------------
-- GST / e-invoice (IRIS IRP) workspace
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS gst_invoices (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  customer_name  VARCHAR(160) NOT NULL,
  customer_gstin VARCHAR(15),
  invoice_number VARCHAR(40)  NOT NULL,
  invoice_date   DATE         NOT NULL,
  taxable_value  NUMERIC(14,2) NOT NULL CHECK (taxable_value >= 0),
  gst_rate       NUMERIC(5,2)  NOT NULL,               -- 0 | 5 | 12 | 18 | 28
  cgst           NUMERIC(14,2) NOT NULL DEFAULT 0,
  sgst           NUMERIC(14,2) NOT NULL DEFAULT 0,
  igst           NUMERIC(14,2) NOT NULL DEFAULT 0,
  total          NUMERIC(14,2) NOT NULL DEFAULT 0,
  irn            VARCHAR(64),                           -- Invoice Reference Number from IRP
  irn_generated  BOOLEAN     NOT NULL DEFAULT FALSE,
  ack_no         VARCHAR(30),
  ack_date       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Social proof + help: reviews from gig workers, FAQs
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reviews (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
  display_name  VARCHAR(120) NOT NULL,                 -- what shows publicly
  platform_name VARCHAR(80),                           -- "Swiggy", "Upwork", ...
  rating        SMALLINT    NOT NULL CHECK (rating BETWEEN 1 AND 5),
  headline      VARCHAR(160) NOT NULL,
  body          TEXT        NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS faqs (
  id         SERIAL PRIMARY KEY,
  question   VARCHAR(300) NOT NULL,
  answer     TEXT         NOT NULL,
  sort_order INTEGER      NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- Indexes — every hot path the backend queries
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_platforms_user        ON platforms (user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_user   ON income_records (user_id);
CREATE INDEX IF NOT EXISTS idx_income_records_plat   ON income_records (platform_id);
CREATE INDEX IF NOT EXISTS idx_statements_user       ON bank_statements (user_id);
CREATE INDEX IF NOT EXISTS idx_stmt_txns_statement   ON statement_transactions (statement_id);
CREATE INDEX IF NOT EXISTS idx_filings_user          ON itr_filings (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_user        ON deadline_reminders (user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due         ON deadline_reminders (due_date);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_user     ON gst_invoices (user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created       ON reviews (created_at DESC);

-- ---------------------------------------------------------------------
-- Dev seed: one demo user so Postgres-only runs aren't empty.
-- (More seed data, including FAQ/review rows, lives in seed.sql.)
-- ---------------------------------------------------------------------
INSERT INTO users (mobile, name, email)
VALUES ('+919820000000', 'Demo Gig Worker', 'demo@gig.app')
ON CONFLICT (mobile) DO NOTHING;
