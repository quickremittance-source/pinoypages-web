import { publicCategories, publicListings } from "@/lib/public";
import {
  categories,
  EVENT_CATEGORIES,
  type EventCategory,
  featuredListings,
  isPaid,
  listings,
  upcomingEvents,
} from "@/lib/guide";

/** Alt design (alt-design branch): derived, never invented. Every number here is counted from the listing data (real free listings only). */
export const GTA_AREAS = [
  "Toronto",
  "Scarborough",
  "North York",
  "Etobicoke",
  "Mississauga",
  "Brampton",
  "Markham",
  "Vaughan",
] as const;

export const CATEGORY_ICONS: Record<string, string> = {
  "tax-accounting": "🧾",
  "insurance-financial": "🛡️",
  "business-services": "📒",
  independents: "💼",
};

/** Combined counts: SAMPLE Money & Business listings + free listings compiled from public information. */
export const categoryCounts = () => [
  ...categories
    .filter((c) => listings.some((l) => l.category === c.slug))
    .map((c) => ({
      slug: c.slug,
      name: c.name,
      href: `/directory/${c.slug}`,
      icon: CATEGORY_ICONS[c.slug] ?? "📁",
      total: listings.filter((l) => l.category === c.slug).length,
      sample: listings.filter((l) => l.category === c.slug).length,
      verified: listings.filter((l) => l.category === c.slug && isPaid(l)).length,
    })),
  ...publicCategories.map((c) => ({
    slug: c.slug,
    name: c.name,
    href: `/directory#pub-${c.slug}`,
    icon: c.icon,
    total: publicListings.filter((l) => l.category === c.slug).length,
    sample: 0,
    verified: 0,
  })),
];

/** Listing counts per area, from the data (includes any GTA area that has a listing). */
export const areaCounts = () => {
  const m = new Map<string, number>();
  for (const l of [...listings, ...publicListings]) m.set(l.area, (m.get(l.area) ?? 0) + 1);
  return [...m.entries()].map(([area, n]) => ({ area, n })).sort((a, b) => b.n - a.n || a.area.localeCompare(b.area));
};

/** Featured = Verified tier with an active badge; falls back to all Verified-tier listings if none are active yet. */
export const featuredForAlt = () => {
  const f = featuredListings();
  return (f.length ? f : listings.filter(isPaid)).map((l) => ({
    id: l.id,
    name: l.name,
    area: l.area,
    tagline: l.tagline ?? "",
    category: categories.find((c) => c.slug === l.category)?.name ?? "",
    icon: CATEGORY_ICONS[l.category] ?? "📁",
    languages: l.languages,
    sample: l.sample,
  }));
};
export type AltCard = ReturnType<typeof featuredForAlt>[number];

export const communityEvents = (limit = 4) =>
  upcomingEvents({ limit }).map((e) => ({
    ...e,
    catLabel: EVENT_CATEGORIES[(e.category ?? "community") as EventCategory],
  }));

/** Popular searches = shortcuts into real directory filters (not a trend claim). */
export const POPULAR = [
  { label: "Restaurants & bakeries", href: "/directory#pub-food" },
  { label: "Groceries", href: "/directory#pub-groceries" },
  { label: "Money & Business", href: "/directory#pub-money-business" },
  { label: "Beauty", href: "/directory#pub-beauty" },
  { label: "In Scarborough", href: "/directory?city=Scarborough" },
  { label: "In Mississauga", href: "/directory?city=Mississauga" },
];
