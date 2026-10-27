# Images

All site images are compressed before they are committed.

- **Limit:** 1600px wide max, 300 KB max per file.
- **Format:** WebP for photos and logos. App icons and favicons (`favicon*`, `icon-*`, `apple-touch-icon`) stay PNG.
- **Credits:** photo credits (e.g. Wikimedia) live in the data files next to each image path, not in image metadata. When a file is renamed to `.webp`, update its path in the data file and keep the credit line as is.

## Commands

    npm run images:optimize   # resize + convert everything in public/ and src/app/
    npm run images:check      # fails if any image is over the limit

`images:check` runs automatically before `npm run build` (`prebuild`) and in `npm run check`, so an oversized image fails the Vercel build.

## Serving from Cloudflare R2 (optional)

Set `NEXT_PUBLIC_IMAGE_BASE` to the bucket's public URL (e.g. `https://pub-xxxx.r2.dev`) to load images from R2; leave it unset to serve from `/public`. Use `img("/brand/x.webp")` from `src/lib/img.ts` for image paths. The CSP `img-src` and `next.config` `images.remotePatterns` pick up the origin automatically.

When the base is set, `next/image` uses `unoptimized` for those files. Tradeoff: Vercel's image optimizer is skipped (no per-device resizing or AVIF), so we avoid Vercel image-optimization and bandwidth usage; files are already compressed to <= 300 KB, so the loss is small. Without R2, Vercel optimizes local images as before.

Upload: `npx wrangler r2 object put pinoypages-images/brand/x.webp --file public/brand/x.webp --remote` (Cloudflare credentials stay on the developer machine, never in the repo or Vercel).

Status (2026-10-27): R2 is not yet enabled on the Cloudflare account; it must be enabled in the Cloudflare dashboard by the account owner first.
