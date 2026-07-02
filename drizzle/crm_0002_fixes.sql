-- ============================================================================
-- Ambassador Field CRM — Phase 1 review fixes (indexes)
-- Target: the CRM/training Supabase project (DATABASE_URL), NOT the website DB.
-- Idempotent + additive: safe to re-run.
-- ============================================================================

-- The old index was (confidence_score DESC) = DESC NULLS FIRST, which cannot
-- serve the target-queue ORDER BY (confidence_score DESC NULLS LAST). Replace
-- it with a partial index matching the hot query's WHERE + ORDER BY exactly.
DROP INDEX IF EXISTS idx_business_confidence;
CREATE INDEX IF NOT EXISTS idx_business_confidence
  ON business (confidence_score DESC NULLS LAST)
  WHERE directory_claim_status = 'unclaimed' AND local_claim_status <> 'claimed';

-- Recent-visits list is always (ambassador, newest first); the composite makes
-- it an index walk and subsumes the old single-column index.
DROP INDEX IF EXISTS idx_visit_ambassador;
CREATE INDEX IF NOT EXISTS idx_visit_ambassador_created
  ON visit (ambassador_id, created_at DESC);
