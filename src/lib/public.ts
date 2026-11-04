import data from "../../content/public-listings.json";
import brevo from "../../content/brevo-listings.json";

/** Free, unverified listings compiled from public information. Name + contact only (Free tier rules). */
export type ListingTier = "free" | "business_card" | "premium";
export type PublicListing = {
  /** Stable analytics id. Never changes, even if the listing is renamed or its URL slug changes. */
  listing_id: string;
  id: string;
  name: string;
  category: string;
  area: string;
  /** "free" for every bundled listing; Neon may carry a paid tier. */
  tier: string;
  /** Analytics tier; current public listings are all free (line listing). */
  listing_tier?: ListingTier;
  /** True only when Neon says verified and verified_until has not passed. */
  verified: boolean;
  verified_until?: string;
  /** Where the listing was confirmed. Kept in the data file, never displayed. */
  source: string;
  address?: string;
  phone?: string;
  website?: string;
  /** Only when the business publishes it. */
  email?: string;
  /** Only when the business publishes a Messenger link. */
  messenger?: string;
};
export type PublicCategory = { slug: string; name: string; icon: string; section: string };
export const OTHERS: PublicCategory = { slug: "others", name: "Others", icon: "📁", section: "community" };
/** Known categories plus "Others" (always last). Lists show only those with at least one public listing. */
export const publicCategories = [...(data.categories as PublicCategory[]), OTHERS];
const KNOWN = new Set((data.categories as PublicCategory[]).map((c) => c.slug));
/** Missing or unknown category → "others". Only the displayed value changes; stored data is untouched. */
export const normalizeCategory = (c: string | null | undefined) => (c && KNOWN.has(c) ? c : OTHERS.slug);
export const withKnownCategory = <T extends { category: string }>(l: T): T =>
  normalizeCategory(l.category) === l.category ? l : { ...l, category: normalizeCategory(l.category) };
/** Public category slugs that have at least one listing in `ls`, in display order (Others last). */
export const nonEmptyCategories = (ls: { category: string }[]) => {
  const has = new Set(ls.map((l) => l.category));
  return publicCategories.filter((c) => has.has(c.slug));
};
export const publicListings = ([...data.listings, ...brevo.listings] as PublicListing[])
  .map(withKnownCategory)
  .sort((a, b) => a.name.localeCompare(b.name));
export const publicIn = (slug: string) => publicListings.filter((l) => l.category === slug);
