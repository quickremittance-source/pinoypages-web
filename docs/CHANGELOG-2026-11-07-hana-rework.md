# Hana review rework — November 7, 2026

## Authority and scope
Jose approved applicable copy/link fixes and Vercel preview testing only, then requested a return handoff for Hana acceptance testing. Muse/Hana is one Meta bot. No production merge/promotion, DNS, Cloudflare, database or Brevo changes.

Hana source: https://drive.google.com/file/d/1DjshaZiB5Y5w1pox8fO_BIN7D_3LtqEJ/view
Hana tested production, not PR 40, against the superseded November 6 rebuild specification. This rework follows Jose's November 7 existing-repository/preview-only scope, not a full Gate 3 rebuild. The report's stated testing end time is later than its file modification time; no timing assumption is used for acceptance.

## Applicable findings addressed
- Removed retired all-inclusive ZCard/QR/monthly-report membership promises from Get Verified, public and legacy listing claim calls to action, List Free, article sidebar, classic home and QR help.
- Kept $199 CAD for the six-month Foundation Edition, capped at 100 memberships; future annual editions and viewable archives remain as approved.
- Removed the ZCard-completion requirement from verification copy, not the live identity check or other identity safeguards. Existing feature/access logic is unchanged.
- Removed stale public listings-close and fixed April print-date promises; print follows 100 confirmed memberships and is mailed to businesses. No replacement dates or print quantities invented. Unused historical configuration dates remain untouched.
- Removed automatic monthly reporting promises and claims that verification gets customers. QR scans are distinguished from contact-button clicks; no click-reporting functionality is claimed as verified.
- The existing /zcard information URL now presents only the optional standard photo landing-page upgrade, price on enquiry. Removed print-ad size sales, sponsored-placement upsells, cross-site claims, unsupported feature roadmap and scarcity copy. Existing logo and route remain; underlying QR/ZCard records are not deleted or changed.
- Preserved draft legal labels. Existing print-ad refund wording remains explicitly marked as an existing draft term; no new refund policy is approved or imposed.
- /directory and /tools redirects and unknown-record 404 behavior are unchanged. Auth and noindex remain unchanged; Tagalog content is untouched.

## Acceptance exclusions / decisions still needed
- /food and /explore have no approved existing destination in this codebase. They remain true 404s; do not distribute printed cards pointing to them. Redirecting to nonexistent /travel/foodie or an unrelated page would hide the problem.
- New /join, thematic sections, per-user admin, member tools, builders, onboarding pipeline, Cloudflare cache acceptance, market separation and a full visual rebuild are outside this approved rework.
- Do not adopt the report's proposed $149 setup/$180 annual pricing. Landing-page price and membership card/QR inclusion remain unapproved.
- Badge expiry still uses legacy quarterly logic. The six-month start/end convention and future renewal/archive benefits need Jose's decision; no silent database/business-rule change.
- Legal finalization requires approval; draft labels intentionally remain. Listing slug/source-prefix and title-suffix restructuring are deferred, not silently changed in a copy/link patch.
- Acceptance must target the exact updated preview and commit, not pinoypages.ca. Vercel access is required; deployment protection is not disabled.

## Verification
New rendered-copy regressions were observed failing before copy changes. Final test/build evidence and exact preview/commit are recorded in the return handoff after completion. Database-dependent behavior is not validated by disconnected local tests.

Final local verification: lint, TypeScript checks and production build passed. Playwright desktop/mobile: 312 passed, 50 skipped, zero failed (database disconnected). The 16 new rendered-copy checks cover the reported retired promises and retained identity/legal safeguards.
