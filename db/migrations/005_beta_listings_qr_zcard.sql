-- Beta: Neon is the source of truth for listings (Brevo sync target), plus QR codes, scan/click analytics,
-- zcards and ad slots. Privacy: no IP, user agent, cookies or visitor identifiers anywhere.
-- Analytics are pre-aggregated daily counters (one upsert per batch), never one row per hit.

-- Listings: Brevo linkage + publish state. Contact email/name are NOT stored in listings (Brevo keeps them).
alter table listings add column if not exists brevo_contact_id bigint;
alter table listings add column if not exists status text not null default 'published';
alter table listings add column if not exists region text not null default 'gta';
alter table listings add column if not exists created_at timestamptz not null default now();
create unique index if not exists listings_brevo_contact_uidx on listings (brevo_contact_id) where brevo_contact_id is not null;
create index if not exists listings_status_cat_area_idx on listings (status, category, area);

-- Public read model: the only thing the website queries. No email, messenger handle or source column.
create or replace view public_listings_v as
  select listing_id, id, name, category, area, tier, verified, verified_until, address, phone, website, region, updated_at
  from listings where status = 'published';

-- Sync audit (counts only).
create table if not exists sync_runs (
  id             bigserial primary key,
  source         text not null,
  rows_upserted  integer not null default 0,
  ran_at         timestamptz not null default now()
);

-- QR codes: short code -> target. Resolved at the edge (Cloudflare Worker or Next route), counted daily.
create table if not exists qr_codes (
  code        text primary key,               -- e.g. bc-<slug>; printed, never changes
  listing_id  text,
  advertiser_id uuid references advertisers (id) on delete set null,
  placement   text not null,                  -- business card, flyer, magazine ad, zcard...
  target_url  text not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);
create index if not exists qr_codes_listing_idx on qr_codes (listing_id);

create table if not exists qr_scan_daily (
  code    text not null,
  day     date not null,
  device  text not null default 'unknown' check (device in ('mobile', 'tablet', 'desktop', 'unknown')),
  n       integer not null default 0,
  primary key (code, day, device)
);

-- Per-listing daily counters (views, calls, map, website taps). listing_stats (monthly) stays for reports.
create table if not exists listing_event_daily (
  listing_id text not null,
  day        date not null,
  event      text not null check (event in ('view', 'scan', 'call', 'map', 'website', 'tap', 'share')),
  n          integer not null default 0,
  primary key (listing_id, day, event)
);
create index if not exists listing_event_daily_day_idx on listing_event_daily (day);

-- zcards: digital business-card ads (not limited to GTA).
create table if not exists zcards (
  id            text primary key,
  advertiser_id uuid references advertisers (id) on delete set null,
  listing_id    text,
  title         text not null,
  body          text,
  image_key     text,                           -- R2 object key, served from the image CDN
  cta_url       text,
  region        text,                           -- null = anywhere
  status        text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  start_date    date,
  end_date      date,
  updated_at    timestamptz not null default now()
);

-- Ad slots (page placements) and bookings.
create table if not exists ad_slots (
  slot        text primary key,               -- e.g. directory-top, category-<slug>-side
  size        text not null check (size in ('full', 'half', 'quarter', 'zcard')),
  page_path   text not null,
  active      boolean not null default true
);
create table if not exists ad_bookings (
  id          bigserial primary key,
  slot        text not null references ad_slots (slot),
  ad_id       text,
  zcard_id    text references zcards (id) on delete set null,
  start_date  date not null,
  end_date    date not null,
  status      text not null default 'booked' check (status in ('booked', 'live', 'ended', 'cancelled'))
);
create index if not exists ad_bookings_slot_dates_idx on ad_bookings (slot, start_date, end_date);

create table if not exists ad_event_daily (
  ad_ref  text not null,                       -- ad id or zcard id
  day     date not null,
  event   text not null check (event in ('impression', 'click', 'scan')),
  n       integer not null default 0,
  primary key (ad_ref, day, event)
)
