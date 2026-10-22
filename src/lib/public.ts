import data from "../../content/public-listings.json";

/** Free, unverified listings compiled from public information. Name + contact only (Free tier rules). */
export type PublicListing = {
  id: string;
  name: string;
  category: string;
  area: string;
  tier: "free";
  verified: false;
  /** Where the listing was confirmed. Kept in the data file, never displayed. */
  source: string;
  address?: string;
  phone?: string;
  website?: string;
};
export type PublicCategory = { slug: string; name: string; icon: string; section: string };
export const publicCategories = data.categories as PublicCategory[];
export const publicListings = (data.listings as PublicListing[]).slice().sort((a, b) => a.name.localeCompare(b.name));
export const publicIn = (slug: string) => publicListings.filter((l) => l.category === slug);
