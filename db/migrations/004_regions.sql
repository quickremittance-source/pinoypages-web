-- Regions: Greater Toronto Area first; more regions later. zcard ads stay region-neutral (region null).
create table if not exists regions (
  slug     text primary key check (slug ~ '^[a-z0-9-]+$'),
  name     text not null,
  short    text not null,
  enabled  boolean not null default false
);
insert into regions (slug, name, short, enabled) values ('gta', 'Greater Toronto Area', 'GTA', true) on conflict (slug) do nothing;

create table if not exists region_cities (
  region  text not null references regions (slug) on delete cascade,
  city    text not null,
  sort    integer not null default 0,
  primary key (region, city)
);

insert into region_cities (region, city, sort) values
  ('gta', 'Toronto', 0),
  ('gta', 'North York', 2),
  ('gta', 'Scarborough', 1),
  ('gta', 'Etobicoke', 3),
  ('gta', 'East York', 4),
  ('gta', 'York', 5),
  ('gta', 'Mississauga', 6),
  ('gta', 'Brampton', 7),
  ('gta', 'Caledon', 8),
  ('gta', 'Markham', 9),
  ('gta', 'Vaughan', 10),
  ('gta', 'Richmond Hill', 11),
  ('gta', 'Aurora', 12),
  ('gta', 'Newmarket', 13),
  ('gta', 'King', 14),
  ('gta', 'Whitchurch-Stouffville', 15),
  ('gta', 'East Gwillimbury', 16),
  ('gta', 'Georgina', 17),
  ('gta', 'Oakville', 18),
  ('gta', 'Burlington', 19),
  ('gta', 'Milton', 20),
  ('gta', 'Halton Hills', 21),
  ('gta', 'Pickering', 22),
  ('gta', 'Ajax', 23),
  ('gta', 'Whitby', 24),
  ('gta', 'Oshawa', 25),
  ('gta', 'Clarington', 26),
  ('gta', 'Uxbridge', 27),
  ('gta', 'Scugog', 28),
  ('gta', 'Brock', 29)
on conflict (region, city) do update set sort = excluded.sort;

alter table listings add column if not exists region text not null default 'gta' references regions (slug);
alter table events add column if not exists region text default 'gta' references regions (slug);
alter table events add column if not exists city text;
update events set city = data->>'city' where city is null and data ? 'city';
-- National (Canada-wide) items are not tied to a region.
update events set region = null where coalesce(city, data->>'city') = 'Canada-wide' and region is not null;
alter table ads add column if not exists region text default 'gta' references regions (slug);
update ads set region = null where tier = 'zcard' and region is not null;
alter table advertisers add column if not exists region text default 'gta' references regions (slug);
create index if not exists listings_region_area_idx on listings (region, area);
create index if not exists events_region_idx on events (region);
create index if not exists ads_region_idx on ads (region)
;
