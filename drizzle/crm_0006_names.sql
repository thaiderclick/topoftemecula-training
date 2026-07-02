-- ============================================================================
-- Category/neighborhood NAMES in the mirror (grant landed on the website side
-- 2026-07-02, website PR #32). Names sharpen the marketing-value tiers.
-- Idempotent + additive: safe to re-run.
-- ============================================================================

ALTER TABLE business ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE business ADD COLUMN IF NOT EXISTS neighborhood_name text;
