# Ads database: proposed Neon schema (design only)

Status: implemented on branch `ads-db` against the Neon database connected to **Vercel Preview only**. Production is not connected and has not been migrated; without `DATABASE_URL` the site falls back to `content/ads.json`.

Migrations: `db/migrations/*.sql`, applied with `npm run db:migrate` (refuses Production unless `ALLOW_PROD_MIGRATE=yes`). Demo seed: `npm run db:seed-demo` (DEMO ads only). Admin view: `/admin/ads?key=<ADMIN_KEY>`. The live schema is in `db/migrations/001_ads.sql`; the SQL below was the original proposal.

## Why

`content/ads.json` is fine for a handful of ads. Once there are many, sales needs to add ads, rotate QR codes and read scan counts without a code deploy.

## Tables

```sql
create table ads (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null check (slug ~ '^[a-z0-9-]+$'),
  tier          text not null check (tier in ('full','half','quarter','zcard')),
  verified      text check (verified in ('verified','verified-plus')),
  name          text not null,
  tagline       text,
  offer         text,
  services      text[] not null default '{}',
  map_query     text,
  website       text,
  listing_id    text,
  features      jsonb not null default '{"saveContact":false,"callButton":false}',
  is_demo       boolean not null default false,
  status        text not null default 'draft' check (status in ('draft','live','ended')),
  starts_on     date,
  ends_on       date,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- One row per printed QR. An ad can have several (one per edition or placement), so scans can be split by print run.
create table ad_tracking_ids (
  tracking_id   text primary key check (tracking_id ~ '^[a-z0-9]{4,12}$'),
  ad_id         uuid not null references ads(id) on delete cascade,
  placement     text,          -- e.g. 'edition-2027-01 p12'
  created_at    timestamptz not null default now(),
  retired_at    timestamptz
);

-- Aggregated counts only. No IP, user agent or cookies (same rule as listing stats).
create table ad_event_counts (
  ad_id         uuid not null references ads(id) on delete cascade,
  tracking_id   text references ad_tracking_ids(tracking_id),
  event         text not null check (event in ('view','scan','call','map','website','tap')),
  month         char(7) not null,   -- Toronto month, '2026-11'
  count         integer not null default 0
);
create unique index ad_event_counts_key on ad_event_counts (ad_id, coalesce(tracking_id, ''), event, month);
```

Updates upsert on `ad_event_counts_key` with `count = count + 1`.

## Rates

No rates or rep rates are stored in these tables. Pricing stays out of the public data: Kabayan Verified is $99/yr + HST, and everything else is "Rates on request".

## Rollout (needs Jose's approval at each step)

1. Create the tables on the Neon Preview branch only, and seed them from ads.json.
2. Point `/ad/[slug]` at the database behind a flag, keeping ads.json as a fallback.
3. Connect production only after Jose's go-ahead.
