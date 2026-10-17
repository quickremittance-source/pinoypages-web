import data from "../../content/guide.json";

/** ONE shared data source: the same JSON drives the website and the print flat plan (scripts/print-plan.mjs). */
export type AdSize = "full" | "half";
export type Ad = (typeof data.ads)[number] & { size: AdSize };
export type Listing = (typeof data.listings)[number];
export type GuidePage = (typeof data.pages)[number] & { ad?: string; ad2?: string };

export const brand = data.brand;
export const dates = data.dates;
export const adMenu = data.adMenu;
export const pages = data.pages as GuidePage[];
export const ads = data.ads as Ad[];
export const categories = data.categories;
export const listings = data.listings;
export const destinations = data.destinations;

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
    .sort((a, b) => Number(b.tier === "featured") - Number(a.tier === "featured") || a.name.localeCompare(b.name));
export const money = (n: number) => (n === 0 ? "Free" : `$${n.toLocaleString("en-CA")}`);
export const longDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
