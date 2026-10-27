import data from "../../content/guide.json";

/** ONE shared data source: the same JSON drives the website and the print flat plan (scripts/print-plan.mjs). */
export type AdSize = "full" | "half";
export type Ad = (typeof data.ads)[number] & { size: AdSize; listing: string; sample?: boolean };
export type Tier = "free" | "verified";
export type ZCard = { person: string; role: string; completed: boolean };
/** Badge upkeep record. "paused" = dead phone, closed business, lapsed vouch or a complaint under review. */
export type BadgeStatus = "active" | "paused";
export type BadgeRecord = {
  status: BadgeStatus;
  /** Listing ids this business vouches for. A vouch counts only when it is mutual (both sides list each other). */
  vouches: string[];
  /** Pilot: founding members are vouched for at the verification visit. */
  foundingVouch?: boolean;
  /** ISO date the last mutual vouch was removed; a 60-day grace period applies. */
  vouchLostOn?: string | null;
  pausedReason?: string;
};
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
  /** Up to three services shown on the Verified card. */
  services?: string[];
  /** SAMPLE owner story (2–3 sentences), shown on Verified pages. */
  story?: string;
  /** Short SAMPLE quote from the owner (always labelled SAMPLE on the site). */
  quote?: string;
  why?: string;
  hours?: string;
  serviceArea?: string;
  sample: boolean;
  /** ISO date of the verification visit (paid tiers only). Paid = eligible; the visit earns the badge. */
  verifiedOn?: string | null;
  zcard?: ZCard;
  badge?: BadgeRecord;
};
export type GuidePage = (typeof data.pages)[number] & { ad?: string; ad2?: string; toolQr?: string };

export const brand = data.brand;
export const dates = data.dates;
export type MenuItem = (typeof data.adMenu)[number] & { recommended?: boolean };
export const tierName = (t: Tier) => data.adMenu.find((o) => o.id === t)?.name ?? t;
export const adMenu = data.adMenu as MenuItem[];
export const terms = data.terms;
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
const rank: Record<Tier, number> = { verified: 1, free: 0 };
/** Two tiers. Verified ($99 one-time, everything included) gets the counted /go/ link, QR, ZCard, Save contact,
 * featured spot, Call / Book, photos and a counter card. Free = unverified, name + contact only. */
export const isPaid = (l?: Pick<Listing, "tier">) => !!l && l.tier === "verified";
/** Kept for call sites: in the two-tier pilot every Verified listing is featured. */
export const isFeatured = isPaid;

const DAY = 86_400_000;
export const BADGE_VALID_MONTHS = 12;
export const VOUCH_GRACE_DAYS = 60;
const addMonths = (iso: string, n: number) => {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d;
};
/** Mutual vouches: partners this listing vouches for that are Verified and vouch back. */
export function mutualPartners(l: Listing, all: Listing[] = listings) {
  return (l.badge?.vouches ?? [])
    .map((id) => all.find((x) => x.id === id))
    .filter((p): p is Listing => !!p && isPaid(p) && (p.badge?.vouches ?? []).includes(l.id));
}
export type BadgeState = "none" | "pending" | "active" | "paused" | "expired";
/**
 * Verified Kabayan badge state. Never bought: a Verified listing is only eligible. "active" needs
 * the visit (verifiedOn + ZCard completed), one mutual vouch (or the pilot founding vouch, or a removed vouch
 * still inside the 60-day grace period), status "active", and a verification date within the last 12 months.
 */
export function badgeState(l: Listing | undefined, now: Date = new Date(), all: Listing[] = listings): BadgeState {
  if (!l || !isPaid(l)) return "none";
  if (!l.verifiedOn || !l.zcard?.completed) return "pending";
  if (l.badge?.status === "paused") return "paused";
  if (now.getTime() >= addMonths(l.verifiedOn, BADGE_VALID_MONTHS).getTime()) return "expired";
  const b = l.badge;
  const inGrace =
    !!b?.vouchLostOn && now.getTime() - new Date(`${b.vouchLostOn}T12:00:00Z`).getTime() <= VOUCH_GRACE_DAYS * DAY;
  const vouched = !!b?.foundingVouch || mutualPartners(l, all).length > 0 || inGrace;
  if (!vouched) return b?.vouchLostOn ? "paused" : "pending";
  return b?.status === "active" ? "active" : "pending";
}
/** The badge shows only when the state is "active". */
export const isVerified = (l?: Listing, now?: Date) => badgeState(l, now) === "active";
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
  /** Host listing id (linked from the event page when the host is Verified). */
  listing?: string;
  category?: EventCategory;
  /** Directory sub-category this event belongs to (shown on that sub-category page). */
  sub?: string;
  city?: string;
  venue?: string;
  address?: string;
  /** 24h local start/end times, "18:30". */
  start?: string;
  end?: string;
};
export type EventCategory = "tax" | "money" | "business" | "insurance" | "community" | "awards";
export const EVENT_CATEGORIES: Record<EventCategory, string> = {
  tax: "Tax",
  money: "Saving & money",
  business: "Business",
  insurance: "Insurance",
  community: "Community",
  awards: "Awards",
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

// ---------- Prototype v1 helpers (directory, cards, search) ----------
export const categoryBySlug = (slug: string) => categories.find((c) => c.slug === slug);
export const sectionBySlug = (slug: string) => sections.find((s) => s.slug === slug);
export const langsOf = (l: Pick<Listing, "languages">) => l.languages.split(",").map((s) => s.trim());
export const cities = [...new Set(listings.map((l) => l.area))].sort();
export const languages = [...new Set(listings.flatMap(langsOf))].sort((a, b) =>
  a === "English" ? -1 : b === "English" ? 1 : a.localeCompare(b),
);
/** Two-letter logo mark for a business (prototype: no uploaded logos yet). */
export const initials = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter((w) => w.length > 2 || /^[A-Z]/.test(w))
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join("");
const LOGO_COLORS = ["#C8102E", "#0E7C86", "#0A5F67", "#9B1B30", "#14606B", "#B5452F"];
export const logoColor = (id: string) =>
  LOGO_COLORS[[...id].reduce((a, c) => a + c.charCodeAt(0), 0) % LOGO_COLORS.length]!;
/** "Oct 6, 2026" */
export const shortDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-CA", { year: "numeric", month: "short", day: "numeric" });
/** Verified listings first (active badge before pending/paused/expired), then free; alphabetical inside. */
export function sortListings(ls: Listing[], now = new Date()) {
  const w = (l: Listing) => (l.tier === "free" ? 0 : badgeState(l, now) === "active" ? 2 : 1);
  return ls.slice().sort((a, b) => w(b) - w(a) || a.name.localeCompare(b.name));
}
export const featuredListings = (now = new Date()) =>
  sortListings(
    listings.filter((l) => isVerified(l, now)),
    now,
  );

/** Upcoming events (today or later), optionally for one sub-category; featured first within the same day. */
export function upcomingEvents({
  now = new Date(),
  sub,
  limit = 3,
  community = true,
}: { now?: Date; sub?: string; limit?: number; community?: boolean } = {}) {
  const today = now.toISOString().slice(0, 10);
  return events
    .filter((e) => e.kind === "community" && e.date >= today)
    .filter((e) => !sub || e.sub === sub || (community && !e.sub))
    .slice(0, limit);
}
export const eventHost = (e: CalEvent) => (e.listing ? listingById(e.listing) : undefined);
export const eventMapUrl = (e: CalEvent) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${e.venue ?? e.place}, ${e.city ?? ""}, ON`)}`;
