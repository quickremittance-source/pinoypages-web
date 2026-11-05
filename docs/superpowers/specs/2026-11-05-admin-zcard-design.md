# Private Admin ZCard — Approved Design

Date: 2026-11-05
Status: Approved by Jose; specification only, no UI implementation in this change.

## Goal and scope

Provide site administrators with one private workspace for full-page ZCard ads. Administrators can inspect QR analytics, create labelled QR codes and download them, edit the ZCard landing copy, and link or unlink a directory listing. ZCards remain an advertiser product, not a Kabayan Verified benefit.

Version 1 is site-admin only. A future listing-user portal may ignore this interface entirely; it does not inherit access or implementation obligations from this design.

## Architecture

Use the existing Next.js App Router, admin session/authentication helpers, QR redirect and generation patterns, advertiser/ad records, analytics storage and database access patterns. Keep reads server-side and mutations behind authenticated server endpoints/actions. Reuse existing UI patterns rather than introduce a second admin framework or database.

Implementation must inspect existing record relationships and helpers before choosing physical fields. The logical data contract below is authoritative for this feature, not a claim that specific tables or columns already exist. Where persisted fields are missing, add the smallest additive, reviewed migration to the existing database; do not duplicate records or destructively migrate data.

## Routes and navigation

- `/admin/zcard`: private index of full-page ZCard ads, with advertiser/title, slug, linked-listing state and a link to each detail page. Include a clear empty state and a link from the existing admin navigation.
- `/admin/zcard/[slug]`: detail workspace for one full-page ZCard ad. Unknown or ineligible slugs return a safe not-found response after authentication.
- Four labelled tabs: **Analytics**, **QR**, **Landing**, **Listing**. Analytics is the default. A validated query parameter can preserve the selected tab across reloads; invalid values fall back to Analytics.

### Analytics

Show QR activity grouped by code and calendar day, with code labels and an explicit reporting date range and timezone. Reuse the existing analytics definitions and disclose what is counted; do not label scans as unique visitors or sales without supporting data. Use America/Toronto day boundaries consistently and show a no-data state rather than invented metrics.

### QR

List existing codes for the current ad. Create an additional labelled code using existing QR/redirect conventions, with validated labels and collision-safe identifiers. Existing code destinations and scan history remain valid. Offer authenticated PNG and PDF downloads with the correct media types and safe filenames. Downloads contain the selected code, retain a readable quiet zone and do not create a new code implicitly. QR target URLs point only to the intended existing ZCard destination; arbitrary redirect targets are not accepted.

### Landing

Edit only the ZCard-specific landing copy supported by the existing landing renderer. Prefill saved values, validate lengths and supported fields, and show save success/error feedback. Render stored copy safely: no arbitrary HTML or script injection. Saving must not silently overwrite directory listing fields, pricing, advertiser identity or article text. The admin workspace is private, but intentionally saving landing copy updates the existing advertiser-facing landing content.

### Listing

Show the currently linked directory listing and allow selecting an existing listing, linking it, or unlinking the association. Validate that the listing exists and that association constraints are satisfied. Unlinking clears only the association; it never deletes or archives a listing, ad, QR code or analytics record. Require explicit confirmation before unlinking and explain the effect. Do not create listings or synchronize Brevo from this tab.

## Authentication and security

All index/detail reads, mutations, analytics requests and downloads require the same server-validated admin-key session as `/admin`. Apply the existing unauthenticated redirect/denial behavior; a client-side navigation guard is insufficient. Recheck authorization on every mutation and download, including direct URL requests.

Never expose the admin key in URLs, rendered output, logs, client bundles or the public repository. Reuse existing cookie and request-integrity protections, including origin/CSRF checks for writes. Scope every operation to the selected ad and validate submitted identifiers server-side. Record mutations through the existing audit pattern without secrets or unnecessary personal data.

Keep pages noindex and private responses non-cacheable; do not emit private data through shared caches or static generation. Do not add admin pages to public navigation or sitemaps. Existing public QR redirects and ZCard landing pages keep their existing visibility; protecting admin tools must not break them.

## Logical data contract

- **ZCard ad:** stable identifier/slug, advertiser association, full-page eligibility and existing lifecycle status.
- **QR code:** stable identifier, parent-ad association, human-readable label and existing redirect destination. Preserve historical identifiers.
- **Analytics:** existing QR events aggregated by code/day with documented count semantics, date range and timezone; do not add new invasive tracking.
- **Landing:** saved supported copy fields belonging to the ZCard ad.
- **Listing link:** optional directory-listing association, subject to existing cardinality constraints.
- **Audit:** actor/session attribution through existing conventions, action, target and timestamp for writes.

Use the existing database and parameterized access helpers. Bound queries and aggregation ranges to avoid unbounded event reads and keep processing costs low. Perform dependent association writes atomically where required. Handle stale/conflicting writes with a visible error rather than silently applying an invalid association.

## Accessibility and presentation

Follow existing admin typography and Pinoy Pages brand tokens. Use semantic headings, labelled inputs and controls, visible keyboard focus, adequate contrast and descriptive download links. Tab navigation must work with keyboard and screen readers (either ordinary navigation links with current-state semantics, or a complete ARIA tab implementation). Provide accessible table headings and textual analytics summaries, not chart-only information. Announce validation and save results and retain entered values after failures.

## Testing and acceptance

- Unauthenticated index/detail visits, mutations and downloads cannot read or change private data; expired sessions are denied.
- Authenticated administrators can open the index and all four tabs, including empty/error states. Non-full-page ads and unknown slugs are handled safely.
- Analytics grouping, date boundaries and code/ad isolation are tested against fixtures, including days around daylight-saving transitions.
- QR labels are validated; generated PNG/PDF files have correct headers and decode to the intended destination. Existing redirects still resolve.
- Landing validation, safe rendering, successful saves and failure recovery are covered; unrelated listing and article data remains unchanged.
- Link/unlink tests cover valid, invalid, stale and conflicting associations; unlink confirmation and preservation of source records are verified.
- Audit writes and private cache/noindex behavior are checked. Keyboard navigation, focus and accessible labels are exercised at desktop and mobile widths.
- Run the repository tests and production build with `DATABASE_URL` unset and `CI=1`, using test fixtures rather than production writes. Preview verification uses authorized test data only.

## Out of scope

Listing-user authentication/portal, self-service advertiser access, Verified benefits changes, QR retirement or deletion, ad billing/payment, new analytics providers, public navigation redesign, bulk imports, Brevo sync, Tagalog article edits and destructive database changes are excluded. This specification does not authorize sending messages, changing production records or implementing the UI.
