import type { PublicListing } from "@/lib/public";

export type NeonListingRow = Record<string, string | boolean | Date | null>;

const day = (v: unknown) => (v instanceof Date ? v.toISOString().slice(0, 10) : v ? String(v).slice(0, 10) : undefined);

/** Map one public_listings_v row, passing tier/verified/verified_until through. Expired verification shows no badge. */
export function fromNeonRow(r: NeonListingRow, today = new Date().toISOString().slice(0, 10)): PublicListing {
  const until = day(r.verified_until);
  const l: PublicListing = {
    listing_id: String(r.listing_id),
    id: String(r.id),
    name: String(r.name),
    category: (r.category as string) ?? "",
    area: (r.area as string) ?? "",
    tier: (r.tier as string) || "free",
    verified: r.verified === true && (!until || until >= today),
    source: "",
  };
  if (until) l.verified_until = until;
  if (r.address) l.address = String(r.address);
  if (r.phone) l.phone = String(r.phone);
  if (r.website) l.website = String(r.website);
  return l;
}

/**
 * Neon rows win per listing_id. Bundled listings that Neon has never seen are kept, so the directory never shows
 * fewer than the bundled set. Listings Neon knows but has hidden (knownIds, any status) are NOT re-added.
 */
export function mergeListings(neon: PublicListing[], bundled: PublicListing[], knownIds: Set<string>): PublicListing[] {
  const seen = new Set(neon.map((l) => l.listing_id));
  const extra = bundled.filter((b) => !seen.has(b.listing_id) && !knownIds.has(b.listing_id));
  return [...neon, ...extra].sort((a, b) => a.name.localeCompare(b.name));
}
