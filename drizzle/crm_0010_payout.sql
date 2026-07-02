-- ============================================================================
-- Payout recording: marking an ambassador paid groups their unpaid verified
-- claims + upgrade bonuses into a payout_batch (money moves outside the app —
-- Venmo/Zelle/check — this records that it happened).
-- Idempotent + additive: safe to re-run.
-- ============================================================================

ALTER TABLE upgrade_bonus ADD COLUMN IF NOT EXISTS payout_batch_id integer;
DO $$ BEGIN
  ALTER TABLE upgrade_bonus ADD CONSTRAINT upgrade_bonus_payout_batch_fkey
    FOREIGN KEY (payout_batch_id) REFERENCES payout_batch(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE payout_batch ADD COLUMN IF NOT EXISTS note text;
