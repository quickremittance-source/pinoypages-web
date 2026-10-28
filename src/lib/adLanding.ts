import { z } from "zod";
import data from "../../content/ads.json";

/** QR ad landing pages. Separate from nav, magazine and sitemap; reached only by scanning a printed ad. */
export const TIERS = ["full", "half", "quarter", "zcard"] as const;
export type Tier = (typeof TIERS)[number];
export const TIER_LABEL: Record<Tier, string> = {
  full: "Full page",
  half: "Half page",
  quarter: "Quarter page",
  zcard: "Pinoy Pages zcard",
};
/** Max photos shown per tier. */
export const TIER_PHOTOS: Record<Tier, number> = { full: 6, half: 3, quarter: 1, zcard: 0 };

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
  /** Stable short id printed in the QR (?t=); scans are counted per tracking id. */
  trackingId: z.string().regex(/^[a-z0-9]{4,12}$/),
  /** Kabayan Verified ($99/yr + HST) or Kabayan Verified++ (Verified + QR + zcard bundle, rates on request). */
  verified: z.enum(["verified", "verified-plus"]).nullable(),
  /** Feature flags; off unless set true, so buttons can be re-enabled per ad later. */
  features: z
    .object({ saveContact: z.boolean().default(false), callButton: z.boolean().default(false) })
    .default({ saveContact: false, callButton: false }),
});
export type AdLanding = z.infer<typeof Ad>;
export const adLandings: AdLanding[] = z.array(Ad).parse(data.ads);
export const adBySlug = (slug: string) => adLandings.find((a) => a.slug === slug);
/** Analytics key for an ad page, stored alongside listing counts. */
export const adStatId = (slug: string) => `ad:${slug}`;
/** Valid ids: "ad:<slug>" or "ad:<slug>:<trackingId>" (scan counted per printed QR). */
export const isAdStatId = (id: string) => {
  const [p, slug, t, extra] = id.split(":");
  const a = p === "ad" && slug ? adBySlug(slug) : undefined;
  return !!a && extra === undefined && (t === undefined || t === a.trackingId);
};
export const PRINT_ORIGIN = "https://pinoypages.ca";
export const adQrUrl = (a: AdLanding) => `${PRINT_ORIGIN}/ad/${a.slug}?src=qr&t=${a.trackingId}`;
export const VERIFIED_LABEL = { verified: "Kabayan Verified", "verified-plus": "Kabayan Verified++" } as const;
/** Kabayan Verified is $99/yr + HST; Verified++ bundle shows "Rates on request". */
export const VERIFIED_PRICE = { verified: "$99/yr + HST", "verified-plus": "Rates on request" } as const;
export const mapsUrl = (q: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;

/** Only full and half ads get a landing page; quarter and zcard QR scans redirect to the listing. */
export const hasLandingPage = (tier: Tier) => tier === "full" || tier === "half";
export const listingTarget = (a: Pick<AdLanding, "listingId">) =>
  a.listingId ? `/listing/${a.listingId}` : "/directory";
/** zcard gets a QR only with the Kabayan Verified++ add-on; every other tier always has one. */
export const hasQr = (a: Pick<AdLanding, "tier" | "verified">) => a.tier !== "zcard" || a.verified === "verified-plus";
