-- ============================================================================
-- Value-weighted routing: mirror the website's vertical_type so the route
-- builder can favor businesses that typically pay for marketing.
-- Idempotent + additive: safe to re-run.
-- ============================================================================

ALTER TABLE business ADD COLUMN IF NOT EXISTS vertical_type text;
