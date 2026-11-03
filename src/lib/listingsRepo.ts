import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { publicListings, type PublicListing } from "@/lib/public";

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
    const rows = (await sql.query(
      `select listing_id, id, name, category, area, address, phone, website from public_listings_v order by name`,
    )) as Array<Record<string, string | null>>;
    if (!rows.length) return { listings: publicListings, source: "file" };
    const listings = rows.map((r) => {
      const l: PublicListing = {
        listing_id: r.listing_id!,
        id: r.id!,
        name: r.name!,
        category: r.category ?? "",
        area: r.area ?? "",
        tier: "free",
        verified: false,
        source: "",
      };
      if (r.address) l.address = r.address;
      if (r.phone) l.phone = r.phone;
      if (r.website) l.website = r.website;
      return l;
    });
    return { listings, source: "neon" };
  } catch {
    return { listings: publicListings, source: "file" };
  }
}

export const getPublicListings = unstable_cache(load, ["public-listings-v1"], {
  revalidate: 3600,
  tags: [LISTINGS_TAG],
});
