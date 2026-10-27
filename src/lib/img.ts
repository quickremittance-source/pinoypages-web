/**
 * Image URL helper. When NEXT_PUBLIC_IMAGE_BASE is set (e.g. a Cloudflare R2
 * public URL), site images load from there; otherwise from local /public.
 */
export const IMAGE_BASE = (process.env.NEXT_PUBLIC_IMAGE_BASE ?? "").replace(/\/+$/, "");

export function img(path: string): string {
  if (/^https?:\/\//.test(path) || !IMAGE_BASE) return path;
  return `${IMAGE_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}

/** R2 files are pre-optimized, so skip Vercel's image optimizer for them. */
export const unoptimizedRemote = !!IMAGE_BASE;
