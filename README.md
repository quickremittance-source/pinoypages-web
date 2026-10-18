# pinoypages-web (folder: pinoypera-web) — CONFIDENTIAL (private repo + protected Vercel only)

Lean Next.js 15 site that mirrors the 20-page printed guide, page for page.

- **One data source:** `content/guide.json` holds brand, dates, ad menu, page order, 11 ad slots, listings and destinations.
  The website reads it via `src/lib/guide.ts`. `npm run print:plan` writes `print/flatplan.csv` (page → section → ads → QR URL with UTM) for the print layout.
- **Rename the brand:** edit `brand` in `content/guide.json` (name, short, tagline, siteUrl, utmCampaign). Nothing else needs changing.
- **Sell an ad:** set the slot's `status` to `"sold"` and fill in advertiser/headline/body/url. It then shows on the matching web page and in the flat plan.
- **Forms:** ad inquiry and claim/upgrade use Server Actions + zod. Nothing is emailed. Locally, submissions go to `data/submissions.jsonl` (git-ignored); on Vercel they go to function logs only.
- **QR codes:** every Verified listing has a stable short link `/go/<id>`, which counts the scan (no personal data, bots ignored) and redirects to its ZCard bridge page `/card/<id>` with UTM tags. Pilot menu (per issue): Free (unverified: name + contact, no QR) · Verified $199 (everything included). Verified gets `/qr/<id>/qr.{png,svg,pdf}`, `/qr/<id>/counter.pdf`, `/vcard/<id>.vcf` and a ZCard. The Verified Kabayan badge shows only when `badgeState()` is `active`: visit done (`verifiedOn` + `zcard.completed`), one mutual vouch (or founding vouch / 60-day grace), status active, verified within 12 months. Otherwise the listing shows paused, expired or pending. Tests decode every QR.
- **Prototype v1 routes (branch `dev`):** `/` home · `/directory` (+ `/directory/money-business` category, `/directory/<sub>` sub-categories) with client-side search by name, sub-category, city, language (`?q=&sub=&city=&lang=`) · `/listing/<id>` · `/card/<id>` ZCard bridge (mobile-first, no forms) · `/get-verified` (same content as `/upgrade`, print page 19) · `/awards` preview · `/report/<id>` unlisted scan-report demo (SAMPLE numbers + live `/go` counter; noindex, not in sitemap). All 15 businesses are fictional SAMPLE data with 555-01xx numbers. Screenshots: `node scripts/screenshots.mjs http://localhost:3300 /workspace/previews`.
- **Private:** `noindex` header + robots disallow-all until launch.

```bash
npm ci
npm run lint && npm run typecheck && npm run build
PW_CHROMIUM_PATH=/usr/bin/google-chrome npm test   # Playwright + axe, desktop + mobile
npx next start -p 3300
```

Deploy (only after `gh auth login` and `vercel login`):
`gh repo create <name> --private --source . --push`, then `vercel link` and `vercel deploy`.
Keep Vercel Authentication (Deployment Protection) ON for all deployments.
