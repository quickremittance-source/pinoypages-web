-- Pinoy Pages ads + QR analytics. Aggregated counts only: no IP, user agent, cookies or personal data.
create extension if not exists pgcrypto;

create table if not exists ads (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null check (slug ~ '^[a-z0-9-]+$'),
  tier        text not null check (tier in ('full', 'half', 'quarter', 'zcard')),
  verified    text not null default 'none' check (verified in ('none', 'verified', 'verified_plus')),
  status      text not null default 'draft' check (status in ('draft', 'live', 'ended')),
  is_demo     boolean not null default false,
  listing_id  text,                       -- optional link to a directory listing id (content/guide.json / public listings)
  features    jsonb not null default '{"saveContact": false, "callButton": false}',
  content     jsonb not null,             -- name, tagline, offer, services, photos, phone, whatsapp, website, mapQuery
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists ads_listing_idx on ads (listing_id);

-- One row per printed QR; an ad can have several (one per edition or placement).
create table if not exists ad_tracking_ids (
  tracking_id text primary key check (tracking_id ~ '^[a-z0-9]{4,12}$'),
  ad_id       uuid not null references ads (id) on delete cascade,
  placement   text,
  created_at  timestamptz not null default now(),
  retired_at  timestamptz
);
create index if not exists ad_tracking_ad_idx on ad_tracking_ids (ad_id);

-- Monthly aggregates. tracking_id = '' means "not tied to a printed QR".
create table if not exists ad_event_counts (
  ad_id       uuid not null references ads (id) on delete cascade,
  tracking_id text not null default '',
  event       text not null check (event in ('view', 'scan', 'call', 'map', 'website', 'tap')),
  month       char(7) not null check (month ~ '^\d{4}-\d{2}$'),
  count       integer not null default 0,
  primary key (ad_id, tracking_id, event, month)
);
