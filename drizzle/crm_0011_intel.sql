-- ============================================================================
-- Pre-call intel: per-business AI diagnostics ambassadors read before walking
-- in (what AI engines say about THIS business, opener/objection ammunition).
-- Cached — regenerated when stale. Idempotent + additive: safe to re-run.
-- ============================================================================

-- Weekly per-category check: who the model recommends for this business type.
CREATE TABLE IF NOT EXISTS ai_category_check (
  id             serial PRIMARY KEY,
  category_name  text NOT NULL UNIQUE,
  mentioned_names text[] NOT NULL DEFAULT '{}',
  raw_response   text,
  model          text,
  checked_at     timestamptz NOT NULL DEFAULT now()
);

-- Per-business synthesized intel (opener, insight, objection + counter).
CREATE TABLE IF NOT EXISTS ai_stop_intel (
  id            serial PRIMARY KEY,
  business_id   uuid NOT NULL UNIQUE REFERENCES business(business_id) ON DELETE CASCADE,
  intel         jsonb NOT NULL,
  probe_raw     text,
  model         text,
  generated_at  timestamptz NOT NULL DEFAULT now()
);
