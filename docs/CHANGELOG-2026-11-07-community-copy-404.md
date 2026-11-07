# Community copy + admin 404 fix (branch fix/consistent-copy-404s, 2026-11-07)

## 404 root cause (fixed)
- All `/admin/*` pages called `notFound()` when signed out. The `pp_admin` cookie is HttpOnly, SameSite=Strict, 8h, so any
  admin link opened from email/chat/another site (cookie not sent) or an expired session showed "Page not found".
- Fix: `src/lib/adminGuard.ts` `requireAdmin(path)` -> signed out redirects (307) to `/admin/login?next=<path>`;
  `src/lib/adminReturn.ts` `safeAdminNext()` accepts only local `/admin...` paths (rejects `//`, backslash, external, `/admin/login`).
  Login form/action carry `next`. Authorization, cookie flags, rate limit unchanged; no key in URLs. If `ADMIN_KEY` is unset, still 404.
- Kept true 404s: unknown listing/ad/zcard records, `/stats/<bad>`, admin file routes (QR PNG downloads), dev-only paths, `/admin/analytics/summary?key=`.
- Kept redirects: `/directory`->`/`, `/tools`->`/magazine`, deadlines -> calendar. Old `/advertise?size=` links still open (200).

## Copy (current business terms)
- Community page (`src/app/advertise/page.tsx`) rewritten: Free listing / Membership and verification $199 for the Foundation Edition /
  Standard ad landing page with photo (price on enquiry). Foundation = six-month pilot, 100 memberships; annual editions after; archived, still viewable.
  Printed directory released after 100 confirmed memberships, mailed to businesses. Removed print ad sizes, ZCard ad promo, sample ad slots.
- Removed quarterly / loyalty $99.50 / "per issue" wording: `content/guide.json`, GetVerified, PlanTable, terms, zcard page, StickyCta,
  ListingResults, ArticleView, Forms, onboarding welcome draft, alt/AltHome, adLanding, advertisers. Footer + tabs: "Community".
- Enquiry form: options now `verified`, `landing-photo` (server enum still accepts old ad-* values; `landing-photo` approval creates nothing automatically).

## Needs owner sign-off / not changed
- Landing-page upgrade price (+$99 suggested, NOT shown). Membership card + listing QR inclusion: shown as "To be confirmed".
- `src/lib/onboarding.ts` badge expiry still computes a quarterly validity date (business logic, not copy) - needs six-month rule decision.
- Edition name still "Pinoy Pages 2026–2027"; "Listings close" date from config; badge check still mentions completing ZCard on the call.
- Per-action click analytics (phone/website/email/directions) not verified in code; copy only claims QR scan counts.
- Existing "we send an invoice after confirming" wording retained from prior copy (no payment gateway).
