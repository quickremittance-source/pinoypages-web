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

/** Alt design (alt-design branch): derived, never invented. Every number here is counted from the SAMPLE data. */
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
  ...categories.map((c) => ({
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
  { label: "Tax returns", href: "/directory?sub=tax-accounting" },
  { label: "Insurance & mortgage", href: "/directory?sub=insurance-financial" },
  { label: "Bookkeeping", href: "/directory?sub=business-services" },
  { label: "Freelancers", href: "/directory?sub=independents" },
  { label: "Speaks Tagalog", href: "/directory?lang=Tagalog" },
  { label: "In Mississauga", href: "/directory?city=Mississauga" },
];
