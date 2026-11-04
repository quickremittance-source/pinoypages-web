import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { publicListings, withKnownCategory, type PublicListing } from "@/lib/public";
import { fromNeonRow, mergeListings, type NeonListingRow } from "@/lib/listingsMerge";

export const LISTINGS_TAG = "listings";

/**
 * Listings from Neon (public_listings_v: no emails, contact names or source), cached in the Next data cache
 * for 1 hour and tagged "listings" so a Brevo sync can revalidate on demand. Falls back to the bundled JSON
 * (content/*.json) when DATABASE_URL is missing, the query fails, or the table is empty.
 */
async function load(): Promise<{ listings: PublicListing[]; source: "neon" | "file" }> {
  const sql = db();
  if (!sql) return { listings: publicListings, source: "file" };
  try {
    const [rows, known] = (await Promise.all([
      sql.query(
        `select listing_id, id, name, category, area, tier, verified, verified_until, address, phone, website
           from public_listings_v order by name`,
      ),
      sql.query(`select listing_id from listings`),
    ])) as [NeonListingRow[], Array<{ listing_id: string }>];
    if (!rows.length) return { listings: publicListings, source: "file" };
    const listings = mergeListings(
      rows.map((r) => fromNeonRow(r)),
      publicListings,
      new Set(known.map((k) => k.listing_id)),
    );
    return { listings: listings.map(withKnownCategory), source: "neon" };
  } catch {
    return { listings: publicListings, source: "file" };
  }
}

export const getPublicListings = unstable_cache(load, ["public-listings-v2"], {
  revalidate: 3600,
  tags: [LISTINGS_TAG],
});
