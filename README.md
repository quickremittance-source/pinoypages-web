# pinoypages-web (folder: pinoypera-web) — CONFIDENTIAL (private repo + protected Vercel only)

Lean Next.js 15 site that mirrors the 20-page printed guide, page for page.

- **One data source:** `content/guide.json` holds brand, dates, ad menu, page order, 11 ad slots, listings and destinations.
  The website reads it via `src/lib/guide.ts`. `npm run print:plan` writes `print/flatplan.csv` (page → section → ads → QR URL with UTM) for the print layout.
- **Rename the brand:** edit `brand` in `content/guide.json` (name, short, tagline, siteUrl, utmCampaign). Nothing else needs changing.
- **Sell an ad:** set the slot's `status` to `"sold"` and fill in advertiser/headline/body/url. It then shows on the matching web page and in the flat plan.
- **Forms:** ad inquiry and claim/upgrade use Server Actions + zod. Nothing is emailed. Locally, submissions go to `data/submissions.jsonl` (git-ignored); on Vercel they go to function logs only.
- **QR codes:** every listing has a stable short link `/go/<id>`, which logs the scan and redirects with UTM tags. Pilot menu (per issue): Free (unverified, no QR) · Verified $99 · Verified Plus $199 · Verified Ad $350 half / $600 full. Paid tiers get `/qr/<id>/qr.{png,svg,pdf}` and a ZCard bridge section on their listing page; Verified Plus and up also get `/qr/<id>/counter.pdf`. The Verified Kabayan badge shows only when `verifiedOn` is set and `zcard.completed` is true (paid = eligible; the visit earns it). Tests decode every QR.
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
