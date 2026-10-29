-- Advertisers (linked to listings and ads) + first-party site analytics (daily aggregates).
-- Privacy: no IP, user agent, cookies or personal visitor data. Only path, referrer host, day and device class.
create extension if not exists pgcrypto;

create table if not exists advertisers (
  id             uuid primary key default gen_random_uuid(),
  business_name  text not null,
  contact_name   text,
  contact_email  text,
  contact_phone  text,
  tier           text not null default 'verified' check (tier in ('verified', 'verified_plus', 'ads_only')),
  ad_sizes       text[] not null default '{}' check (ad_sizes <@ array['full', 'half', 'quarter', 'zcard']::text[]),
  status         text not null default 'draft' check (status in ('draft', 'active', 'paused', 'ended')),
  start_date     date,
  end_date       date,
  is_demo        boolean not null default false,
  stats_token    text unique not null default encode(gen_random_bytes(18), 'hex'),
  notes          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists advertiser_listings (
  advertiser_id  uuid not null references advertisers (id) on delete cascade,
  listing_id     text not null,
  primary key (advertiser_id, listing_id)
);

alter table ads add column if not exists advertiser_id uuid references advertisers (id) on delete set null;
create index if not exists ads_advertiser_idx on ads (advertiser_id);

create table if not exists site_daily (
  day       date not null,
  path      text not null,
  ref_host  text not null default '',
  device    text not null check (device in ('mobile', 'tablet', 'desktop')),
  event     text not null default 'pageview',
  count     integer not null default 0,
  primary key (day, path, ref_host, device, event)
);
create index if not exists site_daily_day_idx on site_daily (day);
