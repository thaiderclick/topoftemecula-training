-- ============================================================================
-- Phase 2a — real auth (Supabase email+password credentials, own sessions)
-- Target: the CRM/training Supabase project (DATABASE_URL).
-- Idempotent + additive: safe to re-run.
-- ============================================================================

-- One-time 6-digit password-reset codes (emailed via Resend). Codes are stored
-- as sha256 hashes and expire; rows are small and pruned opportunistically.
CREATE TABLE IF NOT EXISTS auth_reset_code (
  id          serial PRIMARY KEY,
  email       varchar(320) NOT NULL,
  code_hash   text NOT NULL,
  expires_at  timestamptz NOT NULL,
  used        boolean NOT NULL DEFAULT false,
  created_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_auth_reset_email ON auth_reset_code (email, created_at DESC);

-- Email becomes the human identity: one account per email. Legacy name-keyed
-- rows have NULL email and are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS uq_users_email_lower ON users (lower(email)) WHERE email IS NOT NULL;
