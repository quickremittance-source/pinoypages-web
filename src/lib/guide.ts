import data from "../../content/guide.json";

/** ONE shared data source: the same JSON drives the website and the print flat plan (scripts/print-plan.mjs). */
export type AdSize = "full" | "half";
export type Ad = (typeof data.ads)[number] & { size: AdSize; listing: string; sample?: boolean };
export type Tier = "free" | "verified" | "plus" | "half" | "full";
export type ZCard = { person: string; role: string; completed: boolean };
export type Listing = {
  id: string;
  category: string;
  name: string;
  area: string;
  phone: string;
  languages: string;
  email: string;
  tier: Tier;
  tagline?: string;
  website?: string;
  sample: boolean;
  /** ISO date of the verification visit (paid tiers only). Paid = eligible; the visit earns the badge. */
  verifiedOn?: string | null;
  zcard?: ZCard;
};
export type GuidePage = (typeof data.pages)[number] & { ad?: string; ad2?: string; toolQr?: string };

export const brand = data.brand;
export const dates = data.dates;
export type MenuItem = (typeof data.adMenu)[number] & { recommended?: boolean };
export const tierName = (t: Tier) => data.adMenu.find((o) => o.id === t)?.name ?? t;
export const adMenu = data.adMenu as MenuItem[];
export const renewal = data.renewal;
export const terms = data.terms;
/** Member renewal price = locked pilot price minus the member renewal discount (draft terms only; never public). */
export const renewalPrice = (price: number) => Math.round(price * (1 - renewal.memberDiscountPct / 100));
export const pages = data.pages as GuidePage[];
export const ads = data.ads as Ad[];
export const categories = data.categories;
/** Top-level categories, one per section (expandable): live now, or "coming" in a later edition. */
export type Section = {
  slug: string;
  name: string;
  status: "live" | "coming";
  edition: string;
  note?: string;
  subcategories: string[];
};
export const sections = data.sections as Section[];
export const listings = data.listings as Listing[];
const rank: Record<Tier, number> = { full: 4, half: 3, plus: 2, verified: 1, free: 0 };
/** Paid tiers (Verified and up) get the counted /go/ link, QR, ZCard bridge and Save contact. Free = unverified. */
export const isPaid = (l?: Pick<Listing, "tier">) => !!l && l.tier !== "free";
/** Verified Plus and up: featured spot, Call / Book, photos and a QR counter card. */
export const isFeatured = (l?: Pick<Listing, "tier">) => !!l && rank[l.tier] >= rank.plus;
/**
 * Verified Kabayan badge: never bought. Shown only when the listing is paid (eligible) AND the visit passed all three
 * checks (kabayan-owned/run, really trading, ZCard completed), recorded as verifiedOn + zcard.completed.
 */
export const isVerified = (l?: Listing) => !!l && isPaid(l) && !!l.verifiedOn && !!l.zcard?.completed;
/** Directions link (Google Maps search by business name + area; no address stored). */
export const mapUrl = (l: Pick<Listing, "name" | "area">) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${l.name}, ${l.area}, ON`)}`;
export const listingById = (id: string) => listings.find((l) => l.id === id);
export type CalEvent = {
  id: string;
  kind: "deadline" | "community";
  tier: "free" | "featured";
  name: string;
  date: string;
  time: string;
  place: string;
  organizer: string;
  contact: string;
  source?: string;
  sample?: boolean;
  description?: string;
  link?: string;
  listing?: string;
};
export const events = (data.events as CalEvent[]).slice().sort((a, b) => a.date.localeCompare(b.date));
export const eventMenu = data.eventMenu;
export const seasons = data.seasons;
export const eventById = (id: string) => events.find((e) => e.id === id);
export const isFeaturedEvent = (id: string) => eventById(id)?.tier === "featured";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? brand.siteUrl;
export const abs = (path = "/") => `${SITE_URL}${path === "/" ? "" : path}`;

/** URL printed as a QR code on a magazine page: matching site page + UTM tags. */
export function qrUrl(p: GuidePage) {
  const q = new URLSearchParams({
    utm_source: "guide",
    utm_medium: "qr",
    utm_campaign: brand.utmCampaign,
    utm_content: `p${p.page}`,
  });
  return `${abs(p.route)}?${q.toString()}`;
}

export const adById = (id?: string) => ads.find((a) => a.id === id);
/** Ads that appear on a given site route, in print page order. */
export function adsForRoute(route: string) {
  return pages
    .filter((p) => p.route === route)
    .flatMap((p) => [p.ad, p.ad2])
    .map(adById)
    .filter((a): a is Ad => Boolean(a));
}
export const pageFor = (route: string) => pages.find((p) => p.route === route && p.section !== "ad");
export const listingsIn = (slug: string) =>
  listings
    .filter((l) => l.category === slug)
    .sort((a, b) => rank[b.tier] - rank[a.tier] || a.name.localeCompare(b.name));
export const money = (n: number) => (n === 0 ? "Free" : `$${n.toLocaleString("en-CA")}`);
export const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
