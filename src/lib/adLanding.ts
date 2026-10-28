import { z } from "zod";
import data from "../../content/ads.json";

/** QR ad landing pages. Separate from nav, magazine and sitemap; reached only by scanning a printed ad. */
export const TIERS = ["full", "half", "quarter", "card"] as const;
export type Tier = (typeof TIERS)[number];
export const TIER_LABEL: Record<Tier, string> = {
  full: "Full page",
  half: "Half page",
  quarter: "Quarter page",
  card: "Business card",
};
/** Max photos shown per tier. */
export const TIER_PHOTOS: Record<Tier, number> = { full: 6, half: 3, quarter: 1, card: 0 };

const Ad = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  tier: z.enum(TIERS),
  demo: z.boolean(),
  name: z.string().min(1),
  tagline: z.string(),
  offer: z.string(),
  services: z.array(z.string()),
  photos: z.number().int().min(0),
  phone: z.string().min(1),
  whatsapp: z.string().nullable(),
  website: z.string().url().nullable(),
  mapQuery: z.string().min(1),
  listingId: z.string().nullable(),
});
export type AdLanding = z.infer<typeof Ad>;
export const adLandings: AdLanding[] = z.array(Ad).parse(data.ads);
export const adBySlug = (slug: string) => adLandings.find((a) => a.slug === slug);
/** Analytics key for an ad page, stored alongside listing counts. */
export const adStatId = (slug: string) => `ad:${slug}`;
export const isAdStatId = (id: string) => id.startsWith("ad:") && !!adBySlug(id.slice(3));
export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
