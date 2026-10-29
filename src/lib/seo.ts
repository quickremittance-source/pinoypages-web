import { publicCategories, publicListings, type PublicListing } from "@/lib/public";

/** Indexing stays OFF unless ALLOW_INDEXING=true is set explicitly (owner's choice: noindex until launch). */
export const ALLOW_INDEXING = process.env.ALLOW_INDEXING === "true";
/**
 * Per-section indexing flags, so one section can be opened to search engines before the rest.
 * zcard pages index only when ALLOW_INDEXING_ZCARD=true (default off; owner's choice).
 */
export const SECTION_INDEXING = { zcard: ALLOW_INDEXING || process.env.ALLOW_INDEXING_ZCARD === "true" } as const;
export const sectionRobots = (s: keyof typeof SECTION_INDEXING) =>
  SECTION_INDEXING[s] ? { index: true, follow: true } : { index: false, follow: false };

export const slugOf = (l: PublicListing) => l.id.replace(/^pub-/, "");
export const bizPath = (l: PublicListing) => `/business/${slugOf(l)}`;
export const byBizSlug = (slug: string) => publicListings.find((l) => slugOf(l) === slug);
export const listingEventParams = (l: PublicListing) => ({
  listing_id: l.listing_id,
  business_id: l.id,
  business_name: l.name,
  category: catName(l.category),
  verified: String(l.verified),
  listing_tier: l.listing_tier ?? "free",
});
export const catName = (slug: string) => publicCategories.find((c) => c.slug === slug)?.name ?? slug;

/** "<Name> – <Category>, <Neighbourhood>, Toronto" (no "Toronto, Toronto" for downtown). */
export function bizTitle(l: PublicListing) {
  const place = l.area === "Toronto" ? "Toronto" : `${l.area}, Toronto`;
  return `${l.name} – ${catName(l.category)}, ${place}`;
}
export function bizDescription(l: PublicListing) {
  const bits = [`${l.name} is a Filipino ${catName(l.category).toLowerCase()} listing in ${l.area}`];
  if (l.address) bits.push(`at ${l.address}`);
  return `${bits.join(" ")}. Free, unverified listing in the Pinoy Pages GTA directory${l.phone ? `; call ${l.phone}` : ""}.`;
}

/** URL phrase for each category in landing pages, e.g. /filipino-restaurants-scarborough. */
const CAT_PHRASE: Record<string, [string, string]> = {
  food: ["filipino-restaurants", "Filipino restaurants"],
  groceries: ["filipino-grocery-stores", "Filipino grocery stores"],
  beauty: ["filipino-beauty-wellness", "Filipino beauty and wellness"],
  health: ["filipino-health-care", "Filipino health and care"],
  "money-business": ["filipino-money-business", "Filipino money and business services"],
  immigration: ["filipino-immigration-settlement", "Filipino immigration and settlement services"],
  events: ["filipino-events-celebrations", "Filipino events and celebrations"],
  "home-trades": ["filipino-home-trades", "Filipino home and trades"],
  education: ["filipino-education-kids", "Filipino education and kids"],
  community: ["filipino-community-faith", "Filipino community and faith groups"],
};
const areaSlug = (a: string) => a.toLowerCase().replace(/[^a-z0-9]+/g, "-");

export type Landing = { slug: string; category: string; area: string; heading: string; listings: PublicListing[] };
/** Only combinations that actually have listings. */
export const landings: Landing[] = (() => {
  const out: Landing[] = [];
  for (const c of publicCategories) {
    const phrase = CAT_PHRASE[c.slug];
    if (!phrase) continue;
    const areas = [...new Set(publicListings.filter((l) => l.category === c.slug).map((l) => l.area))].sort();
    for (const area of areas) {
      const ls = publicListings.filter((l) => l.category === c.slug && l.area === area);
      if (!ls.length) continue;
      out.push({
        slug: `${phrase[0]}-${areaSlug(area)}`,
        category: c.slug,
        area,
        heading: `${phrase[1]} in ${area === "Toronto" ? "downtown Toronto" : area}`,
        listings: ls,
      });
    }
  }
  return out;
})();

/** LocalBusiness JSON-LD from real fields only; missing fields are omitted, nothing is invented. */
export function localBusinessLd(l: PublicListing, url: string) {
  const ld: Record<string, unknown> = { "@context": "https://schema.org", "@type": "LocalBusiness", name: l.name, url };
  if (l.phone) ld.telephone = l.phone;
  if (l.email) ld.email = l.email;
  if (l.website) ld.sameAs = [l.website];
  const addr: Record<string, string> = { "@type": "PostalAddress", addressRegion: "ON", addressCountry: "CA" };
  if (l.address) addr.streetAddress = l.address;
  addr.addressLocality = l.area;
  ld.address = addr;
  return ld;
}
