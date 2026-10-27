import metaFile from "../../content/food-meta.json";
import { publicListings, type ListingTier, type PublicListing } from "@/lib/public";
import { bizPath } from "@/lib/seo";

/** Controlled dish tags. Set only from the business's own website/menu (evidence in content/food-tag-sources.json) or an approved owner update — never guessed from names. */
export const DISH_TAGS = [
  "lechon",
  "sisig",
  "adobo",
  "pancit",
  "lumpia",
  "halo-halo",
  "ensaymada",
  "pandesal",
  "kakanin",
  "bibingka",
  "puto bumbong",
  "kare-kare",
  "sinigang",
  "longganisa",
  "tocino",
  "ube",
  "silog",
  "inasal",
  "lomi",
  "bbq skewers",
  "catering",
] as const;
export type DishTag = (typeof DISH_TAGS)[number];

export const FOOD_TYPES = {
  restaurant: { en: "Restaurant", tl: "Restawran" },
  bakery: { en: "Bakery", tl: "Panaderya" },
  grocery: { en: "Grocery", tl: "Tindahan ng Pagkain" },
  caterer: { en: "Caterer", tl: "Caterer" },
} as const;
export type FoodType = keyof typeof FOOD_TYPES;

/** English with proper Tagalog alongside (not Taglish). */
export const FOOD_COPY = {
  kicker: { en: "Foodie Finder", tl: "Hanapin ang Pagkain" },
  title: { en: "Filipino Foodie Finder", tl: "Hanapin ang Pagkaing Filipino" },
  intro: {
    en: "Restaurants, bakeries, groceries and caterers from the Pinoy Pages directory. Dish tags come from each business's own website or menu. Owners can claim a listing to add or correct them.",
    tl: "Mga restawran, panaderya, tindahan at caterer mula sa direktoryo ng Pinoy Pages. Ang mga putahe at menu ay lilitaw lamang pagkatapos ang may-ari ay mag-claim at maaprubahan ang update.",
  },
  city: { en: "City / Area", tl: "Lungsod / Lugar" },
  type: { en: "Type", tl: "Uri" },
  dish: { en: "Dish", tl: "Putahe" },
  openNow: { en: "Open now", tl: "Bukas ngayon" },
  empty: {
    en: "No food businesses match these filters. Clear them, or claim your listing so kabayan can find you.",
    tl: "Walang nahanap na negosyo. Linisin ang filter, o i-claim ang inyong listing.",
  },
  claimPrompt: {
    en: "Is this your restaurant, bakery, grocery or catering business? Claim the listing to add dish tags and a menu link.",
    tl: "Iyo ba ang restawran, panaderya, tindahan o catering na ito? I-claim ang listing upang magdagdag ng putahe at menu.",
  },
  suggest: { en: "Suggest an update", tl: "Magmungkahi ng update" },
  menu: { en: "Menu", tl: "Menu" },
  lastUpdated: { en: "Last updated", tl: "Huling binago" },
  stale: { en: "Menu may be out of date", tl: "Maaaring luma na ang menu" },
  featured: { en: "Featured dishes", tl: "Itinatampok na putahe" },
  paidPerk: {
    en: "Uploaded menus and featured dishes are available on Business Card and Premium plans.",
    tl: "Ang upload ng menu at itinatampok na putahe ay available sa Business Card at Premium.",
  },
} as const;

export function bi(pair: { en: string; tl: string }): string {
  return `${pair.en} · ${pair.tl}`;
}

const BAKERY_RE = /bakery|bakeshop|bake shop|bakers|bakeshoppe/i;
const CATERER_RE = /catering|caterer/i;

/** Days of week keys used in owner-supplied hours (optional). */
export type DayHours = { open: string; close: string };
export type WeeklyHours = Partial<
  Record<"mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun", DayHours | null>
>;

export type FeaturedDish = { name: string; note?: string };

/** Approved, published food metadata for one listing (from content/food-meta.json). */
export type FoodMeta = {
  dishTags?: DishTag[];
  menuUrl?: string;
  menuUpdatedAt?: string;
  featuredDishes?: FeaturedDish[];
  featuredUpdatedAt?: string;
  hours?: WeeklyHours;
};

type MetaFile = {
  schemaVersion?: number;
  listings: Record<string, FoodMeta>;
};

const meta = metaFile as MetaFile;

export function foodMetaFor(listingId: string): FoodMeta {
  return meta.listings[listingId] ?? {};
}

/**
 * Map a public listing to a food type.
 * - groceries → grocery
 * - food + bakery name keywords → bakery
 * - food + catering name keywords → caterer
 * - remaining food → restaurant
 * Returns null when the listing is outside food/groceries (not shown on /food).
 */
export function classifyFoodType(l: PublicListing): FoodType | null {
  if (l.category === "groceries") return "grocery";
  if (l.category !== "food") return null;
  if (BAKERY_RE.test(l.name)) return "bakery";
  if (CATERER_RE.test(l.name)) return "caterer";
  return "restaurant";
}

/**
 * Listings that look food-related by name but sit outside food/groceries categories,
 * so they cannot be typed for the Foodie Finder without inventing a category change.
 */
export function unclassifiedFoodAdjacent(): { listing_id: string; name: string; category: string }[] {
  return publicListings
    .filter((l) => l.category !== "food" && l.category !== "groceries")
    .filter((l) => /catering|caterer|restaurant|bakery|grocery|supermarket|lechon|kakanin|halo.?halo/i.test(l.name))
    .map((l) => ({ listing_id: l.listing_id, name: l.name, category: l.category }));
}

export type FoodListing = PublicListing & {
  foodType: FoodType;
  dishTags: DishTag[];
  menuUrl?: string;
  menuUpdatedAt?: string;
  featuredDishes: FeaturedDish[];
  featuredUpdatedAt?: string;
  hours?: WeeklyHours;
  /** Effective analytics/plan tier (listing_tier wins when set). */
  effectiveTier: ListingTier;
};

const MENU_STALE_DAYS = 90;

export function isMenuStale(updatedAt: string | undefined, now = new Date()): boolean {
  if (!updatedAt) return false;
  const t = Date.parse(updatedAt);
  if (!Number.isFinite(t)) return false;
  return now.getTime() - t > MENU_STALE_DAYS * 24 * 60 * 60 * 1000;
}

export function canShowUploadedMenu(tier: ListingTier): boolean {
  return tier === "business_card" || tier === "premium";
}

function effectiveTier(l: PublicListing): ListingTier {
  return l.listing_tier ?? (l.tier as ListingTier) ?? "free";
}

/** All directory listings that qualify for the Foodie Finder (real data only). */
export function foodListings(): FoodListing[] {
  const out: FoodListing[] = [];
  for (const l of publicListings) {
    const foodType = classifyFoodType(l);
    if (!foodType) continue;
    const m = foodMetaFor(l.listing_id);
    const tier = effectiveTier(l);
    const tags = (m.dishTags ?? []).filter((t): t is DishTag => (DISH_TAGS as readonly string[]).includes(t));
    const featured = canShowUploadedMenu(tier) ? (m.featuredDishes ?? []) : [];
    out.push({
      ...l,
      foodType,
      dishTags: tags,
      menuUrl: m.menuUrl,
      menuUpdatedAt: m.menuUpdatedAt,
      featuredDishes: featured,
      featuredUpdatedAt: m.featuredUpdatedAt,
      hours: m.hours,
      effectiveTier: tier,
    });
  }
  return out.sort((a, b) => a.name.localeCompare(b.name));
}

export type FoodFilters = {
  city: string;
  type: string;
  dish: string;
  open: boolean;
};

export function parseFoodFilters(
  sp: Record<string, string | string[] | undefined> | URLSearchParams,
): FoodFilters {
  const get = (k: string) => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? "";
    const v = sp[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  const type = get("type").trim();
  const dish = get("dish").trim().toLowerCase();
  return {
    city: (get("city") || get("area")).trim(),
    type: type in FOOD_TYPES ? type : "",
    dish: (DISH_TAGS as readonly string[]).includes(dish) ? dish : "",
    open: get("open") === "1" || get("open") === "now",
  };
}

/** True when the listing publishes weekly hours we can evaluate. */
export function hasKnownHours(l: Pick<FoodListing, "hours">): boolean {
  if (!l.hours) return false;
  return Object.values(l.hours).some((h) => h && h.open && h.close);
}

const WEEKDAY_TO_KEY: Record<string, keyof WeeklyHours> = {
  Sun: "sun",
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
};

/** Whether the business is open at `now` in America/Toronto. Requires known hours. */
export function isOpenNow(l: Pick<FoodListing, "hours">, now = new Date()): boolean {
  if (!hasKnownHours(l) || !l.hours) return false;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const key = WEEKDAY_TO_KEY[weekday];
  if (!key) return false;
  const slot = l.hours[key];
  if (!slot) return false;
  const cur = parseInt(hour, 10) * 60 + parseInt(minute, 10);
  const openParts = slot.open.split(":").map((n) => parseInt(n, 10));
  const closeParts = slot.close.split(":").map((n) => parseInt(n, 10));
  const oh = openParts[0];
  const om = openParts[1];
  const ch = closeParts[0];
  const cm = closeParts[1];
  if (oh === undefined || om === undefined || ch === undefined || cm === undefined) return false;
  if (![oh, om, ch, cm].every((n) => Number.isFinite(n))) return false;
  const openM = oh * 60 + om;
  const closeM = ch * 60 + cm;
  if (closeM <= openM) return cur >= openM || cur < closeM;
  return cur >= openM && cur < closeM;
}

export function filterFoodListings(items: FoodListing[], f: FoodFilters): FoodListing[] {
  return items.filter((l) => {
    if (f.city && l.area !== f.city) return false;
    if (f.type && l.foodType !== f.type) return false;
    if (f.dish && !l.dishTags.includes(f.dish as DishTag)) return false;
    if (f.open) {
      if (!hasKnownHours(l)) return false;
      if (!isOpenNow(l)) return false;
    }
    return true;
  });
}

export function foodHref(f: Partial<FoodFilters>): string {
  const p = new URLSearchParams();
  if (f.city) p.set("city", f.city);
  if (f.type) p.set("type", f.type);
  if (f.dish) p.set("dish", f.dish);
  if (f.open) p.set("open", "1");
  const qs = p.toString();
  return qs ? `/food?${qs}` : "/food";
}

export function foodFilterOptions(items: FoodListing[]) {
  const cities = [...new Set(items.map((l) => l.area))].sort((a, b) => a.localeCompare(b));
  const anyHours = items.some((l) => hasKnownHours(l));
  return { cities, anyHours };
}

/** Restaurant JSON-LD for restaurants; LocalBusiness otherwise. servesCuisine Filipino. */
export function foodJsonLd(l: FoodListing, url: string): Record<string, unknown> {
  const type = l.foodType === "restaurant" ? "Restaurant" : "LocalBusiness";
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": type,
    name: l.name,
    url,
    servesCuisine: "Filipino",
  };
  if (l.phone) ld.telephone = l.phone;
  if (l.email) ld.email = l.email;
  if (l.website) ld.sameAs = [l.website];
  if (l.menuUrl) ld.menu = l.menuUrl;
  const addr: Record<string, string> = { "@type": "PostalAddress", addressRegion: "ON", addressCountry: "CA" };
  if (l.address) addr.streetAddress = l.address;
  addr.addressLocality = l.area;
  ld.address = addr;
  return ld;
}

export function foodListingHref(l: FoodListing): string {
  return bizPath(l);
}

export function formatMenuDate(iso: string | undefined): string | undefined {
  if (!iso) return undefined;
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return undefined;
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(t));
}
