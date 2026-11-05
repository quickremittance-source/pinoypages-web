# Magazine Collage Heroes — Design Spec

Date: 2026-11-05 · Status: Approved by Jose · Branch: feature branch → Vercel preview → merge after tests/build pass

## Goal

Give the Magazine menu a modern look with one shared, compressed public-domain postcard collage (vintage Philippines + GTA scenes) used as a hero banner. Hero banners only; nothing else changes.

## Scope (pages touched)

- `/magazine` (hub) — replaces the flat aqua lead.
- `/magazine/[slug]` and its `/tl` variant — hero above the article; article body (including all Tagalog text) is untouched.
- `/calendar` (Events) and `/calendar/[id]`.
- `/tools` and each tool page (`/tools/cpp-estimator`, `/tools/hst-checker`, others under `/tools`).

## Architecture

- New server component `src/components/MagazineHero.tsx`, props: `title: string`, `intro?: string`, `eyebrow?: string` (e.g. "Magazine", "Events", "Tools").
- Renders a full-width `<section>` with the collage as a CSS/`next/image` background (`priority`, `sizes="100vw"`), a navy→teal gradient overlay, and white heading + intro.
- Each page in scope imports `MagazineHero` in place of its current hero/lead block. Story, event and tool cards are unchanged.
- Colours come from `src/brand.ts` tokens: navy `#002050`, teal working shade `#0E7C86`, red `#E01820` (accent rule only). Font: Helvetica/Arial stack from globals.css.

## Assets

- `public/brand/magazine/collage.webp` — single collage, ~1600×600, target ≤150 KB.
- `public/brand/magazine/collage.jpg` — small fallback (~800 px wide, ≤80 KB).
- `public/brand/magazine/CREDITS.md` — each source image: title, source URL, public-domain basis (e.g. pre-1929 publication, PD-mark/CC0 on Wikimedia Commons or Library of Congress / Toronto Public Library). Only images with a verifiable public-domain status are used.
- Short credit line rendered under the hero or in the page footer: "Collage of public-domain vintage postcards."

## Accessibility

- Collage is decorative (`alt=""`, `aria-hidden`); the heading carries the meaning (`<h1>` per page).
- Overlay keeps white text contrast ≥ 4.5:1 (navy-dominant gradient at text side).
- Hero height responsive (~220 px mobile, ~320 px desktop); text never overlaps crucial imagery; respects `prefers-reduced-motion` (no animation).

## Performance and cost

- One asset cached by Vercel/Cloudflare CDN across all pages; immutable filename (version suffix if replaced).
- No new runtime dependencies, no client JS, no extra DB queries. Pages stay noindex.

## Testing

- Unit/render test: `MagazineHero` renders title, intro, decorative image with empty alt.
- Asset size check test: `collage.webp` ≤ 150 KB.
- Run `npm test` and `npm run build` with `DATABASE_URL` unset and `CI=1`.
- Vercel preview screenshots of hub, one article (EN + /tl), Events, Tools (mobile + desktop) shared with Jose before merge.

## Out of scope

- Per-section collage variants, CSS mosaics, card redesigns, new articles, Tagalog text edits, Filipino Foodie/Traveller pages, listing/directory pages, Brevo sync.
