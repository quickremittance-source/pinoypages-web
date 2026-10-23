# Analytics, QR, SEO and ad tracking (alt-design)

## GA4 (site-wide)

- Loaded only when `NEXT_PUBLIC_GA_ID` is set at build time (Vercel env). No ID is committed. Without it, no Google script loads and the CSP stays `'self'`-only; with it, the CSP adds googletagmanager.com / google-analytics.com.
- Listing pages (`/business/<slug>`) fire `listing_view`, `click_call`, `click_directions`, `click_website`, `click_messenger`, each with `business_id`, `business_name`, `category`. Directions only show when a real address exists; Messenger only when a `messenger` link is in the data (none yet).
- **In GA4 Admin → Events, mark `click_call`, `click_directions`, `click_website`, `click_messenger`, `qr_scan` and `ad_click` as Key events.** Register `business_id`, `business_name`, `category`, `placement`, `campaign`, `ad_id`, `start_date`, `end_date` as event-scoped custom dimensions so they appear in reports and the Data API.

## Campaign / ad context

- On any landing, `utm_campaign`, `utm_source`, `utm_medium` and `ad_id` from the URL are stored in `sessionStorage` (`pp_ad_ctx`). An `ad_click` also writes its `ad_id`/`campaign`/`placement`.
- Every event (`track()` in `src/lib/gtag.ts`) carries `ad_id`, `campaign`, `ctx_source`, `ctx_medium` from that context, so downstream call/directions/website/messenger clicks and QR-originated visits tie back to the campaign within the session. GA4 also attributes via the UTMs natively.

## QR

- Printed URL: `/q/<abbr>-<slug>` with `ws` window-sticker, `cc` counter-card, `fl` flyer, `eb` event-booth.
- With a GA ID the route serves a tiny page that sends `qr_scan` (business_id, business_name, category, placement, campaign) and redirects within 800 ms; without one it is a 302. Destination: `/business/<slug>?utm_source=qr&utm_medium=<placement>&utm_campaign=founding`.
- `node scripts/export-qr.mjs --base <site> [--out qr-out] [--only <slug>]` writes PNG (1200 px) + SVG per business × placement. Output is gitignored. Print the codes only once the final domain (pinoypages.ca) is decided, since the base URL is baked into each code.

## SEO (indexing still OFF)

- `/business/<slug>` title: `<Name> – <Category>, <Area>, Toronto`; unique description; canonical; LocalBusiness JSON-LD from real fields only (name, url, phone, email, website as sameAs, street address + locality). No hours, geo or ratings are emitted because none are in the data.
- Category + area landing pages (`/filipino-restaurants-scarborough`, etc.) are generated only for combinations with at least one listing.
- `sitemap.xml` includes business and landing pages.
- `noindex` stays on: robots.txt disallows all, `<meta name="robots">` noindex and the `X-Robots-Tag` header remain unless `ALLOW_INDEXING=true` is set. Do not set it until Jose approves launch; then also submit the sitemap in Search Console.

## Paid online placements

- Definitions live in `src/lib/ads.ts` (`ads: AdDef[] = []`, no ads, example schema in a comment). Placements: `homepage-feature`, `category-spotlight`, `premium-top-spot`, `seasonal-spotlight`, `banner`. Slots render nothing when no active ad matches (by date window and, where set, category).
- `ad_impression` fires once per page view when ≥50 % of the slot is visible (IntersectionObserver); `ad_click` fires on click. Both carry `ad_id`, `business_id`, `placement`, `campaign`, `start_date`, `end_date`. Ad links add `utm_source=pinoypages&utm_medium=<placement>&utm_campaign=<campaign>&ad_id=<id>`.

## Reporting (design only, nothing is emailed)

Needs a GA4 property, a service account with Viewer access, and the GA4 Data API enabled (`GA4_PROPERTY_ID`, credentials as a Vercel secret).

- **Per-business monthly stats:** `runReport` filtered by `business_id`, metrics `eventCount` by `eventName` (listing_view, the click_* events, qr_scan), split by `sessionManualMedium` / `ctx_medium` to show QR placement performance. Output is a private PDF/HTML per business, stored in the private Drive folder; sending to advertisers requires Jose's approval each time.
- **Per-ad report:** impressions (`ad_impression`), clicks (`ad_click`), CTR = clicks ÷ impressions, and downstream actions = click_* and qr_scan events in sessions whose `ad_id` matches, within the ad's start/end dates.
- **Admin placement comparison:** an `/admin/analytics` panel (existing admin-key gate) grouping the same metrics by `placement` and `campaign`, so homepage feature vs category spotlight vs premium top spot vs seasonal vs banner can be compared on CTR and downstream actions per dollar once rates exist. Rep rates never appear in this or any public view.
