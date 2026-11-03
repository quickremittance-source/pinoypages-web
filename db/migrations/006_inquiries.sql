-- Every website form submission (ad enquiry, listing claim, free listing, event, newsletter) lands here.
-- Neon is the source of truth; rows are mirrored to Jose's private Google Sheet. Never exposed publicly.
create table if not exists inquiries (
  id            bigserial primary key,
  kind          text not null,                   -- ad-inquiry | listing-claim | free-listing | event-submission | newsletter-signup
  name          text,
  business      text,
  email         text not null,
  phone         text,
  listing_id    text,
  product       text,
  source        text,
  payload       jsonb not null default '{}'::jsonb,
  status        text not null default 'new',      -- new | contacted | won | lost | spam | done
  response      text,                             -- Jose's notes / reply summary
  responded_at  timestamptz,
  sheet_synced  boolean not null default false,
  created_at    timestamptz not null default now()
);
create index if not exists inquiries_kind_status_idx on inquiries (kind, status, created_at desc);
create index if not exists inquiries_unsynced_idx on inquiries (id) where sheet_synced = false
