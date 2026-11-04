import "server-only";
import { BADGE_VALID_MONTHS, isPaid, listings, type Listing } from "@/lib/guide";
import { getPublicListings } from "@/lib/listingsRepo";
import { db } from "@/lib/db";
import { clean, parseLanguages } from "@/lib/cardParse";
import type { PublicListing } from "@/lib/public";
import { bizPath } from "@/lib/seo";

export type CardExtra = { email?: string; languages?: string };

/** Pure: a paid (tier "verified") public/Neon listing as the guide Listing shape the ZCard pieces expect. */
export function toCardListing(p: PublicListing, extra: CardExtra = {}): Listing | undefined {
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
    languages: extra.languages ?? "",
    email: extra.email ?? p.email ?? "",
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
  const l = p && p.tier === "verified" ? toCardListing(p, await cardExtra(p.listing_id)) : undefined;
  return l && p ? { l, fullPath: bizPath(p) } : undefined;
}

/**
 * Email and languages for a PAID card only. public_listings_v deliberately has no email, so this reads the
 * listings row for tier "verified" published listings (the business chose to be on a card). Missing = omitted.
 */
async function cardExtra(listingId: string): Promise<CardExtra> {
  const sql = db();
  if (!sql) return {};
  try {
    const [r] = (await sql.query(
      `select email, data->'languages' as languages from listings
        where listing_id = $1 and tier = 'verified' and status = 'published'`,
      [listingId],
    )) as Array<{ email: string | null; languages: unknown }>;
    if (!r) return {};
    return { email: clean(r.email), languages: parseLanguages(r.languages) };
  } catch {
    return {};
  }
}
