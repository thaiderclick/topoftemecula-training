-- ============================================================================
-- Shift-scoped tracking: GPS stamped on each visit log, plus breadcrumb pings
-- recorded only while a day route is active (no continuous surveillance).
-- Idempotent + additive: safe to re-run.
-- ============================================================================

ALTER TABLE visit ADD COLUMN IF NOT EXISTS lat double precision;
ALTER TABLE visit ADD COLUMN IF NOT EXISTS lng double precision;

CREATE TABLE IF NOT EXISTS route_ping (
  id             serial PRIMARY KEY,
  ambassador_id  integer NOT NULL REFERENCES ambassador(id) ON DELETE CASCADE,
  route_plan_id  integer NOT NULL REFERENCES route_plan(id) ON DELETE CASCADE,
  lat            double precision NOT NULL,
  lng            double precision NOT NULL,
  at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_route_ping_ambassador_at ON route_ping (ambassador_id, at DESC);
