# Private Admin ZCard Implementation Plan

> Spec: `docs/superpowers/specs/2026-11-05-admin-zcard-design.md`

**Goal:** Give site admins a private `/admin/zcard` workspace to inspect full-page ZCard ads (`ads.tier = 'zcard'`), view QR analytics, create labelled QR codes and download PNG/PDF, edit ZCard landing copy, and link or unlink a directory listing.

**Architecture:** Reuse the existing admin session (`isAdmin()` → `notFound()`), `AdminFrame`, ads/`ad_tracking_ids`/`ad_event_*` helpers, `qr_scan_daily` when a listing is linked, and `admin_audit`. No listing-user portal. JSON fallback (`content/ads.json`) when `DATABASE_URL` is unset so preview and CI still render the UI. QR downloads encode `https://pinoypages.ca/zcard/<slug>?src=qr&t=<trackingId>` (the public ZCard landing). New labelled codes insert into `ad_tracking_ids` (native parent-ad association). No new analytics providers and no expansion of the `/go|/card|/qr` target lock.

**Tech stack:** Next.js App Router, server actions, Playwright, Neon via existing `db()`.

## Tasks

- [x] 1. Pure helpers in `src/lib/adminZcard.ts`: `parseTab`, `parseQrLabel`, `makeTrackingId`, `parseLandingForm`, `parseListingAction`, `zcardQrUrl`, `groupByCodeDay` (Toronto day windows, including DST fixtures).
- [x] 2. DB helpers in `src/lib/adminZcardDb.ts`: list/get zcard-tier ads, analytics, list/create tracking IDs, update landing copy only, link/unlink listing (listing must exist; unlink is confirm-only and never deletes records). PNG/PDF in `src/lib/adminZcardQr.ts`.
- [x] 3. Pages: `/admin/zcard` index and `/admin/zcard/[slug]?tab=` with Analytics (default), QR, Landing, Listing. Auth 404. noindex + `force-dynamic`. Nav link in `AdminFrame`. Download route `/admin/zcard/[slug]/qr/[code]/[file]` (png/pdf) with admin cookie, `private, no-store`.
- [x] 4. Tests in `tests/admin-zcard.spec.ts` (no auth → 404; admin index/detail/tabs; invalid tab; non-zcard slug; PNG decodes to the ZCard URL). `CI=1` `DATABASE_URL` unset: typecheck, lint, build, test.
- [x] 5. Commit, push `feat/admin-zcard`, open PR, collect Vercel preview. Do not merge.
