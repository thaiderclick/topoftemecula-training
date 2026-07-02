-- ============================================================================
-- Mirror the website's authoritative claimability flag (their generated column
-- claimable = NOT is_public_place, added website-side 2026-07-02). Replaces the
-- CRM's category/name heuristics for field-target filtering.
-- Idempotent + additive: safe to re-run.
-- ============================================================================

ALTER TABLE business ADD COLUMN IF NOT EXISTS claimable boolean;
