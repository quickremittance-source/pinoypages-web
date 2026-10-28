-- Site content in Neon (listings, categories, events, travel pages) + listing stats.
-- Content files stay the fallback. Aggregated stats only: no IP, user agent or personal data.
create table if not exists listing_categories (
  slug        text primary key,
  name        text not null,
  icon        text,
  section     text,
  updated_at  timestamptz not null default now()
);

create table if not exists listings (
  listing_id     text primary key,          -- stable analytics id
  id             text unique not null,      -- URL id
  name           text not null,
  category       text,
  area           text,
  tier           text not null default 'free',
  verified       boolean not null default false,
  verified_until date,
  dish_tags      text[] not null default '{}',
  address        text,
  phone          text,
  website        text,
  email          text,
  messenger      text,
  source         text,                      -- where confirmed; never displayed
  data           jsonb not null default '{}',
  updated_at     timestamptz not null default now()
);
create index if not exists listings_category_idx on listings (category);

create table if not exists events (
  id          text primary key,
  kind        text,
  tier        text,
  name        text not null,
  date        date,
  category    text,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists events_date_idx on events (date);

create table if not exists travel_pages (
  slug        text primary key,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);

create table if not exists listing_stats (
  listing_id  text not null,
  month       char(7) not null check (month ~ '^\d{4}-\d{2}$'),
  event       text not null check (event in ('view', 'scan', 'call', 'map', 'website', 'tap')),
  n           integer not null default 0,
  primary key (listing_id, month, event)
);
