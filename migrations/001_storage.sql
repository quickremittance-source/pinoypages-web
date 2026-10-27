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

-- Owner-suggested food updates (dish tags, menu URL, featured dishes).
-- Status stays 'pending' until an editor promotes approved fields into content/food-meta.json.
CREATE TABLE IF NOT EXISTS food_updates (
  id BIGSERIAL PRIMARY KEY,
  listing_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payload JSONB NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS food_updates_status_submitted_at
  ON food_updates (status, submitted_at DESC);

CREATE INDEX IF NOT EXISTS food_updates_listing_id
  ON food_updates (listing_id);
