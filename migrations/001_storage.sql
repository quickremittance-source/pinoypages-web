-- Pinoy Pages app storage (submissions + analytics counters).
-- Apply manually when a Postgres database is provisioned. Do not run from the app.

CREATE TABLE IF NOT EXISTS submissions (
  id BIGSERIAL PRIMARY KEY,
  kind TEXT NOT NULL,
  payload JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submissions_kind_submitted_at
  ON submissions (kind, submitted_at DESC);

CREATE TABLE IF NOT EXISTS listing_stats (
  listing_id TEXT NOT NULL,
  month CHAR(7) NOT NULL,
  event TEXT NOT NULL,
  n INT NOT NULL DEFAULT 0,
  PRIMARY KEY (listing_id, month, event)
);
