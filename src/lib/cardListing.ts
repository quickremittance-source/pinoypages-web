import "server-only";
import { BADGE_VALID_MONTHS, isPaid, listings, type Listing } from "@/lib/guide";
import { getPublicListings } from "@/lib/listingsRepo";
import type { PublicListing } from "@/lib/public";
import { bizPath } from "@/lib/seo";

/** Pure: a paid (tier "verified") public/Neon listing as the guide Listing shape the ZCard pieces expect. */
export function toCardListing(p: PublicListing): Listing | undefined {
  if (p.tier !== "verified") return undefined;
  let verifiedOn: string | null = null;
  if (p.verified && p.verified_until) {
    const d = new Date(p.verified_until);
    d.setMonth(d.getMonth() - BADGE_VALID_MONTHS);
    verifiedOn = d.toISOString().slice(0, 10);
  }
  return {
    id: p.id,
    category: p.category,
    name: p.name,
    area: p.area,
    phone: p.phone ?? "",
    languages: "",
    email: p.email ?? "",
    tier: "verified",
    website: p.website,
    sample: false,
    verifiedOn,
  };
}

/** Paid listing for /go, /card and /vcard: bundled guide first, then Neon via getPublicListings (JSON fallback). */
export async function getCardListing(id: string): Promise<{ l: Listing; fullPath: string } | undefined> {
  const g = listings.find((x) => x.id === id && isPaid(x));
  if (g) return { l: g, fullPath: `/listing/${g.id}` };
  const { listings: pub } = await getPublicListings();
  const p = pub.find((x) => x.id === id);
  const l = p && toCardListing(p);
  return l && p ? { l, fullPath: bizPath(p) } : undefined;
}
