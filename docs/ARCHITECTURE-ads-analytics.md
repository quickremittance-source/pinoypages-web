# PinoyPages: ad/listing engine and analytics engine on Neon

Status as of Nov 4, 2026. Sources: `main` after PRs #19–#27 (see section 12). Migrations 001–009 are applied in production (007 verified Nov 4: constraint `qr_codes_target_pinoypages` present and validated).

No keys, passwords or tokens appear in this document.

## 1. Overview

```mermaid
flowchart LR
  B[Brevo contacts<br/>editing source] -- "manual: npm run db:sync-brevo<br/>scripts/import-brevo-listings.mjs (paused)" --> L[(Neon listings)]
  L --> V[(public_listings_v view<br/>no emails / contact names)]
  V -- "unstable_cache 1h, tag listings" --> R[src/lib/listingsRepo.ts]
  J[content/*.json fallback] -.-> R
  R --> P[Pages: directory, business, search]
  A[(Neon ads tier=zcard)] -- "cache 60s/300s" --> Z[/ad, /zcard, directory ZCards/]
  P -- "sendBeacon /api/pv" --> SD[(site_daily)]
  P -- "/api/stat, /go/:id" --> LS[(listing_stats monthly)]
  Z -- "/api/stat ad:slug" --> AE[(ad_event_counts monthly)]
  Q["/qr/:code [PR #18]"] --> QS[(qr_scan_daily)]
  F[Forms] --> I[(inquiries)]
  SD & LS & QS & I --> D["/admin/dashboard, /admin/qr, /stats/:token"]
```

## 2. Listings pipeline

1. **Brevo is the editing source.**
   - `scripts/import-brevo-listings.mjs` (alias `npm run db:sync-brevo`) reads Brevo. It is read-only against Brevo.
   - It upserts FREE, UNVERIFIED, GTA-only business listings into Neon `listings`, keyed by `brevo_contact_id`.
   - Rows that stop qualifying get `status='hidden'`; nothing is deleted.
   - Each run writes a row to `sync_runs`. `--write-fallback` also refreshes `content/brevo-listings.json`.
   - The sync is run by hand only: there is no cron. It is currently **paused** by policy.
   - The reverse script, `scripts/sync-brevo.mjs`, pushes website listings *to* Brevo as contacts. It sends nothing.
2. **Public read model.** `public_listings_v` (migration 005) holds published rows only. It has no email, messenger handle or source column.
3. **Repo.** `src/lib/listingsRepo.ts` `getPublicListings()`:
   - Queries the view and caches the result with `unstable_cache` (`revalidate: 3600`, tag `listings`).
   - Falls back to the bundled JSON (`src/lib/public.ts`) when there is no `DATABASE_URL`, the query fails, or the table is empty.
   - Rows are merged with the JSON by `src/lib/listingsMerge.ts`.
   - Nothing calls `revalidateTag("listings")` yet, so a sync shows up on the site within about an hour.
4. **Tiers and Verified badge.**
   - `fromNeonRow` passes `tier`, `verified` and `verified_until` through. Verification that has expired shows no badge.
   - `src/lib/guide.ts`: `isPaid` means `tier === "verified"`. Badge states are none, pending, active, paused and expired (`src/components/Badge.tsx`).
   - Price is "$199 per issue", with a $99.50 loyalty rate (PR #16).

## 3. Ads, ZCards, slots

- **Ads and ZCards are served from the Neon `ads` table** (`src/lib/adsRepo.ts`):
  - `getAd` is cached for 60 s. `listZcards` (`tier='zcard'`, `status='live'`) is cached for 300 s. Both use tag `ads`.
  - If there is no database, they fall back to `content/ads.json`.
  - `searchZcards` does a text match for the directory search (`src/app/directory/page.tsx`).
- **Sponsored search:** `src/lib/sponsored.ts`, using `sponsored_placements` and `sponsored_event_counts` (monthly).
- **Tables created but not used by code yet:** migration 005 created `zcards`, `ad_slots`, `ad_bookings` and `ad_event_daily`, but no application code reads or writes them. `zcards.image_key` is designed for R2 images, and R2 isn't wired up yet.

## 4. QR codes and redirects

| Route | File | Behaviour |
|---|---|---|
| `/go/<id>[?via=scan\|tap\|call\|map\|web]` | `src/app/go/[id]/route.ts` | Paid listings only. Calls `track()`, which adds 1 to the **monthly** `listing_stats`, then redirects to tel:, the map, the website or `/card/<id>` with UTMs. |
| `/card/<id>` | `src/app/card/[id]/page.tsx` | Static ZCard bridge page per Verified listing, with a view beacon. |
| `/q/<ws\|cc\|fl\|eb>-<slug>` | `src/app/q/[code]/route.ts`, `src/lib/qrcodes.ts` | Print QR codes. Resolved from the JSON listings, not the database. Fires a GA4 `qr_scan` event and redirects to the business page. No database counter. |
| `/qr/<id>/<file>` | `src/app/qr/[id]/[file]/route.ts` | QR image files. |
| `/qr/<code>` **[PR #18, unmerged]** | `src/app/qr/[id]/route.ts` | Active `qr_codes` row → adds 1 to `qr_scan_daily` (code, day, device) → 302 redirect. The target must be `https://(www.)pinoypages.ca/go\|card/<id>`. A `/qr` target or any other host gets a 404. Check: `qrTarget()` in `src/lib/dashRange.ts`. |

Migration **007 (applied in production, validated)**, `db/migrations/007_qr_target_check.sql`, adds a CHECK constraint so `qr_codes.target_url` must match `^https://(www\.)?pinoypages\.ca/(go|card|qr)/…`.

## 5. Inquiries

- Every form submission is handled by `saveInquiry()` (`src/lib/inquiries.ts`), which inserts it into `inquiries` (migration 006).
- The Google Sheet mirror was removed in PR #17. The `sheet_synced` column still exists but nothing uses it.
- **Owner email is gated off:**
  - `notifyEnabled()` (`src/lib/inquiryNotice.ts`) is true only when `INQUIRY_NOTIFY_ENABLED === "true"`. The default is OFF.
  - When enabled, the sender is PinoyPages <info@pinoypages.ca> and it goes to the owner's inbox via Brevo.
- Cleanup is done on demand only. Production has 0 rows as of Nov 3 after the test rows were deleted.

## 6. Analytics engine

**Design:** pre-aggregated counters. Each hit is one `insert … on conflict do update set n = n + 1`, so there is never one row per hit. There are no cookies, IP addresses, user agents or visitor ids (header of migration 005).

| Writer | Endpoint/file | Table | Key |
|---|---|---|---|
| Page views | `src/components/PageView.tsx` → `POST /api/pv` → `recordPageView` (`src/lib/siteAnalytics.ts`) | `site_daily` | day (Toronto), path, referrer host, device, event |
| Listing view/scan/call/map/website/tap | `/api/stat`, `/go/<id>` → `track()` → `store()` (`src/lib/analytics/store.ts`; Neon when `DATABASE_URL` is set, otherwise memory/JSON/Upstash) | `listing_stats` (monthly) | listing_id, month, event |
| QR ad pages `ad:<slug>` | `track()` → `recordAdEvent` | `ad_event_counts` (monthly) | ad, tracking id, month, event |
| Sponsored impressions/clicks | `recordSponsored` | `sponsored_event_counts` (monthly) | placement, month, event |
| Search queries | `src/lib/search.ts` | `search_log` | day, query, results |
| QR scans **[PR #18]** | `/qr/<code>` | `qr_scan_daily` | code, day, device |

Filters:
- Bots are filtered out (`isBot`).
- `/api/pv` honours Do Not Track and Global Privacy Control (DNT/GPC) and skips `/admin`, `/stats` and `/results`.

**Reads:**
- `src/lib/dashboards.ts` **[PR #18]** runs about 13 queries in parallel per range, cached with `unstable_cache` for 300 s per range or advertiser.
- Charts are inline SVG (`src/components/admin/Charts.tsx`), with no chart library.
- **[PR #19]** `track()` now also writes the daily tables `listing_event_daily` and `ad_event_daily`, so the dashboard series fill in from the deploy date onward (no backfill).

## 7. Dashboards and access

- **Overall** **[PR #18]:** `/admin/dashboard?days=7|30|90`.
- **QR trackers** **[PR #18]:** `/admin/qr?days=…`.
- **Classic analytics:** `/admin/analytics`.
- **Advertiser list:** `/admin/advertisers`. It links each advertiser's private stats page, which is how admin can see every advertiser.
- **Admin sign-in [PR #25]:** `/admin/login` (POST the key once) sets the `pp_admin` cookie: HttpOnly, Secure, SameSite=Strict, 8 h, HMAC-signed with ADMIN_KEY (`src/lib/adminSession.ts`). Without a valid session every admin page, admin route and server action gives a 404. No key in any URL. Login is rate-limited (5 failures per 10 min per IP, per instance). `/api/revalidate` and scripts keep the `x-admin-key` header. Every admin page is noindex.
- **Advertiser view:** `/stats/<token>`, where the token is 36 hex characters (`advertisers.stats_token`, a random default in migration 003).
  - Shows monthly tables, plus **[PR #18]** a day-by-day section and that advertiser's QR codes.
  - Every query is filtered by `advertiser_id`.
  - The page is noindex and sends no referrer.

## 8. Tables

| Table | Migration | Purpose | Written by code | Prod rows (Nov 3) |
|---|---|---|---|---|
| listings / public_listings_v | 002/005 | directory listings and their public view | import script | n/a (falls back to JSON when empty) |
| sync_runs | 005 | sync audit | import script | n/a |
| advertisers, advertiser_listings | 003 | advertisers and stats tokens | admin/seed | 0 |
| ads, ad_tracking_ids, ad_event_counts | 001 | ads/ZCards and monthly events | yes | 0 |
| sponsored_placements, sponsored_event_counts | 005_zcard_search | sponsored search | yes | 0 |
| search_log | 005_zcard_search | search counts | yes | 5 |
| site_daily | 003 | page views | yes | 103 |
| listing_stats | 002 | monthly listing events | yes | 0 |
| listing_event_daily | 005 | daily listing events | yes (PR #19) | 0 |
| qr_codes, qr_scan_daily | 005 | QR tracker | PR #18 (scans) | 0 |
| zcards, ad_slots, ad_bookings | 005 | planned booking engine | **no** | 0 |
| ad_event_daily | 005 | daily ad events | yes (PR #19) | 0 |
| admin_audit | 009 | before/after of every admin edit | yes (PR #24) | 0 |
| inquiries | 006/008 | form submissions + onboarding decisions | yes | 0 |

## 9. Cost and Cloudflare

- Pages use Neon serverless over HTTP (`src/lib/db.ts`), so there are no connection pools.
- Reads are cached for 1 h for listings, 1–5 min for ads, and 5 min for dashboards.
- Writes are single-row upserts.
- Cloudflare isn't wired up yet. Migration 005 mentions an "edge (Cloudflare Worker or Next route)" for QR codes and R2 for `zcards.image_key`. Only the Next.js route exists.

## 10. Known gaps

- `zcards`, `ad_slots` and `ad_bookings` are empty and unused. Daily counters start at the PR #19 deploy, so earlier days show zeros.
- Vercel previews have no `DATABASE_URL`. They use the JSON fallback, and the dashboards show "No database connected".
- Nov 3 includes about 467 test page views in `site_daily`. They are kept as-is.
- `/q/<code>` (GA only) and `/qr/<code>` (Neon counter) are two separate QR systems.
- The Brevo sync is paused. When it runs it revalidates the cache (PR #21); admin edits and approvals revalidate immediately.

## 11. Design review

**Benefits (checked against the code)**
- **Low cost:** Neon serverless over HTTP, cached reads (section 9) and pre-aggregated counters.
- **Resilience:** a JSON fallback for listings and ads when the database is missing or failing.
- **Brevo as the editing source**, with manual, idempotent sync that hides rows instead of deleting them.
- **Privacy by design:** no PII in counters; DNT/GPC are honoured; the public view leaves out contact data.
- **QR target lock:** enforced in code by `qrTarget()` **[PR #18]**, and in the database by 007 (applied in production, validated).
- **Simple stack:** Next.js, Neon and SVG charts.

**Risks and recommendations**
1. **Top priority: reset the leaked Neon password.** The code can't confirm this either way. It is reported as not yet reset. Rotate it in Neon, then update `DATABASE_URL` in Vercel and in the local env files.
2. **Advertiser token links never expire.** There is no expiry or revoke column (migration 003). Add `stats_token_expires_at` plus a "rotate token" admin action.
3. **Admin auth [done]:** `/admin/login` takes ADMIN_KEY once and sets an 8h HttpOnly, Secure, SameSite=Strict signed session cookie (signed with ADMIN_KEY, so rotating the key ends all sessions). No key in URLs. Scripts and `/api/revalidate` keep the `x-admin-key` header.
4. **Previews have no database**, so they can't test DB features. Tests run against production also caused test rows (fixed by unsetting `DATABASE_URL` for tests). Use a Neon preview branch per PR through the Vercel integration.
5. **One database write per page view** (`/api/pv`) is fine at today's volume. At scale, batch the writes, for example with a Cloudflare Worker or a queue flushing every minute.
6. **At scale:** serve ZCard images from R2, and move QR redirects to a Worker with KV/edge caching.
7. **Daily listing/ad counters [done, PR #19].**

## 12. Changes in PRs #19–#26 (Nov 3–4, 2026)

- **#19 Daily counters and multi-QR:** fixed dashboard SQL; `track()` writes `listing_event_daily`/`ad_event_daily`; a listing can have several labelled QR codes (`qr_codes`, one per placement), each counted in `qr_scan_daily`.
- **#20 Onboarding (migration 008):** `/admin/inquiries` queue (approve / reject / spam). Approve creates the Neon listing or a draft ad, issues the first QR code, and links a welcome pack (`/admin/welcome/<listing>`) with PNG/SVG QR downloads and a draft email (never sent automatically). The Verified step records the ~15-minute live video identity check (`listings.video_check_at`); Verified is never sold. 008 adds `inquiries.decided_at`, `inquiries.created_ref`, `listings.video_check_at`, `listings.onboarded_inquiry`.
- **#21 Revalidate:** `POST /api/revalidate` with header `x-admin-key` drops the `listings` cache tag (directory, counters, cards). Maintenance only: no public UI, 404 without the key. Approvals and Verified call it automatically. Nav: active page highlighted; deadlines merged into the calendar.
- **#22 Menu:** Directory, Advertise, Magazine; Magazine dropdown holds Events & deadlines (`/calendar`) and Tools. `/advertise` explains the three ways: advertise, get Kabayan Verified ($199 per issue, live video check), or both.
- **#23 Cards from Neon:** `/go`, `/card`, `/vcard` read paid listings from Neon (`src/lib/cardListing.ts`) as well as the bundled guide. Category tiles count public listings. Migration splitter (`scripts/sql-split.mjs`) strips `--` comments outside quotes and `$$` bodies, so `stmt; -- note` lines split correctly (tested).
- **#24 Admin hub and editor (migration 009):** `/admin` hub (site analytics plus sortable per-listing, ad and ZCard metrics, 5-min cache). `/admin/listings` and `/admin/ads/manage` edit, hide/unhide, archive/restore and permanently delete (archived rows only, type DELETE). Every change is written to `admin_audit` (before/after JSON) in the same statement. Editing or hiding a listing sets `listings.locked`, which the Brevo import skips. 009 adds `listings.locked`, `listings.archived_at`, `ads.start_date`, `ads.end_date`, `ads.archived_at` and `admin_audit`.
- **#25 Cookie sign-in:** see section 7. ADMIN_KEY was rotated in Production (Nov 3) and in the analytics-advertisers and ads-db Preview environments (Nov 4).
- **#26 Empty categories and Others:** categories and sub-category tiles with no public listings (Neon `public_listings_v` via `listingsRepo`, JSON fallback) are hidden on tiles, the home grid, filters, counters and the sitemap. Nothing is deleted; they reappear when a listing is filed there. Listings with a missing or unknown category display under **Others** (display-only; stored data unchanged), shown last and hidden when empty.
- **Follow-up (this PR):** ZCards for paid Neon listings show email and languages when the listings row has them (`listings.email`, `data.languages`); `public_listings_v` still has no email. Missing values are omitted, never invented. As of Nov 4 no listing has languages and no paid listing exists yet.
