/**
 * Paid online placement definitions. NO real or fake ads here: the list stays empty until an ad is actually sold.
 * Each slot renders nothing when no active ad matches it.
 *
 * Example shape (do not uncomment with invented data):
 * {
 *   ad_id: "2026-11-hf-001",
 *   advertiser_id: "adv-example",               // stable advertiser id (one advertiser may run many ads)
 *   business_id: "pub-example-business",       // listing_id from content/public-listings.json
 *   slot_position: 1,                          // 1-based slot within the placement (e.g. 4 quarter-page slots)
 *   placement: "homepage-feature",
 *   campaign: "founding",
 *   start_date: "2026-11-01",
 *   end_date: "2026-11-30",
 *   headline: "…", href: "/business/example-business",
 *   category: "food",                          // category-spotlight only
 * }
 */
export const PLACEMENTS = [
  "homepage-feature",
  "category-spotlight",
  "premium-top-spot",
  "seasonal-spotlight",
  "banner",
  /** One Featured travel slot per /travel destination page; slot id = travel-<slug>-featured-1, ad.category = destination slug. */
  "travel-featured",
] as const;
export type Placement = (typeof PLACEMENTS)[number];

export type AdDef = {
  ad_id: string;
  advertiser_id: string;
  business_id: string;
  /** 1-based position among the slots of this placement; each slot has its own ad and impression. */
  slot_position: number;
  placement: Placement;
  campaign: string;
  start_date: string; // YYYY-MM-DD, inclusive
  end_date: string; // YYYY-MM-DD, inclusive
  headline: string;
  href: string;
  category?: string;
};

export const ads: AdDef[] = [];

export function activeAds(placement: Placement, opts: { category?: string; now?: Date } = {}, list: AdDef[] = ads) {
  const today = (opts.now ?? new Date()).toISOString().slice(0, 10);
  return list
    .filter(
      (a) =>
        a.placement === placement &&
        a.start_date <= today &&
        today <= a.end_date &&
        (!opts.category || !a.category || a.category === opts.category),
    )
    .sort((x, y) => x.slot_position - y.slot_position);
}
