# Magazine Collage Heroes — Implementation Plan

**Goal:** Ship the shared public-domain postcard collage hero across Magazine, Events and Tools pages (spec: `docs/superpowers/specs/2026-11-05-magazine-collage-heroes-design.md`).

**Architecture:** One server component `MagazineHero` (drop-in for `PageHead`: kicker, title, intro, page, children) renders `public/brand/magazine/collage.webp` via `next/image` under a navy→teal overlay with brand tokens from `src/brand.ts`. Pages swap `PageHead` → `MagazineHero`; cards and article bodies untouched.

## Tasks

- [x] 1. Source six PD postcards (3 Manila, 3 Toronto) from Wikimedia Commons; record `public/brand/magazine/CREDITS.md`.
- [x] 2. Build 1600×600 collage with PIL; export `collage.webp` (≤150 KB) and `collage.jpg` (≤80 KB).
- [x] 3. Create `src/components/MagazineHero.tsx` (decorative `alt=""`, `priority`, credit line) and CSS so hero children stay legible.
- [x] 4. Wire into `/magazine`, `/magazine/ideas`, `ArticleView` (EN + `/tl`), `/calendar`, `/calendar/[id]`, `/tools/cpp-estimator`, `/tools/hst-checker`.
- [x] 5. Add `tests/magazine-hero.spec.ts` (asset sizes + hero renders per route).
- [ ] 6. `CI=1` with `DATABASE_URL` unset: `npm run build && npm test`.
- [ ] 7. Push `feat/magazine-collage-heroes`, open PR, collect Vercel preview + screenshots for Jose. No merge until Jose reviews.
