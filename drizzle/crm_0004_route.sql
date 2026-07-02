-- ============================================================================
-- Phase 2c — ambassador day routes
-- Target: the CRM/training Supabase project (DATABASE_URL).
-- Idempotent + additive: safe to re-run.
-- ============================================================================

-- One planned route per ambassador per (Pacific-time) day. Stops are an ORDERED
-- jsonb array of { businessId, status: 'pending'|'done'|'skipped' } — business
-- details (name/address/coords) are joined fresh at read time, never denormalized.
CREATE TABLE IF NOT EXISTS route_plan (
  id             serial PRIMARY KEY,
  ambassador_id  integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  plan_date      date NOT NULL,
  stops          jsonb NOT NULL DEFAULT '[]'::jsonb,
  status         text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ambassador_id, plan_date)
);
