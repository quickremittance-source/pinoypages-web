-- Site search (full-text + trigram), paid Sponsored search placements, anonymous search log.
create extension if not exists pg_trgm;

alter table listings add column if not exists search_tsv tsvector generated always as (
  to_tsvector('simple'::regconfig, coalesce(name, '') || ' ' || coalesce(category, '') || ' ' || coalesce(area, '') || ' ' ||
    coalesce(address, '') || ' ' || coalesce(data->>'description', ''))
) stored;
create index if not exists listings_search_idx on listings using gin (search_tsv);
create index if not exists listings_name_trgm_idx on listings using gin (name gin_trgm_ops);

alter table events add column if not exists search_tsv tsvector generated always as (
  to_tsvector('simple'::regconfig, coalesce(name, '') || ' ' || coalesce(category, '') || ' ' ||
    coalesce(data->>'city', '') || ' ' || coalesce(data->>'place', '') || ' ' || coalesce(data->>'description', ''))
) stored;
create index if not exists events_search_idx on events using gin (search_tsv);
create index if not exists events_name_trgm_idx on events using gin (name gin_trgm_ops);

-- Paid search placement ("Sponsored"). Price is rates on request; never stored here.
create table if not exists sponsored_placements (
  id             uuid primary key default gen_random_uuid(),
  advertiser_id  uuid not null references advertisers (id) on delete cascade,
  title          text not null,
  href           text not null check (href ~ '^/[a-z0-9/_-]*$'),
  blurb          text,
  keywords       text[] not null default '{}',
  categories     text[] not null default '{}',
  start_date     date,
  end_date       date,
  active         boolean not null default true,
  is_demo        boolean not null default false,
  created_at     timestamptz not null default now()
);
create index if not exists sponsored_adv_idx on sponsored_placements (advertiser_id);

create table if not exists sponsored_event_counts (
  placement_id  uuid not null references sponsored_placements (id) on delete cascade,
  month         char(7) not null check (month ~ '^\d{4}-\d{2}$'),
  event         text not null check (event in ('impression', 'click')),
  count         integer not null default 0,
  primary key (placement_id, month, event)
);

-- Anonymous search log: query text, result count and day only. No IPs, no user ids.
create table if not exists search_log (
  day      date not null,
  query    text not null,
  results  integer not null,
  n        integer not null default 1,
  primary key (day, query)
);
