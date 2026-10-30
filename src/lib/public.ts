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
  tier: "free";
  /** Analytics tier; current public listings are all free (line listing). */
  listing_tier?: ListingTier;
  verified: false;
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
export const publicCategories = data.categories as PublicCategory[];
export const publicListings = ([...data.listings, ...brevo.listings] as PublicListing[])
  .slice()
  .sort((a, b) => a.name.localeCompare(b.name));
export const publicIn = (slug: string) => publicListings.filter((l) => l.category === slug);
