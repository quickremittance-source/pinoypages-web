import data from "../../content/travel.json";
import creditData from "../../content/travel-credits.json";
import { publicCategories, publicIn, type PublicListing } from "@/lib/public";

export type Hub = "gta" | "abroad";
export type Related = { category: string; label: string; area?: string };
export type Destination = {
  slug: string;
  hub: Hub;
  name: string;
  region: string;
  kind: "TouristAttraction" | "Place";
  geo: [number, number];
  titleSeo?: string;
  summary: string;
  guide: string[];
  bestSeason: string;
  gettingThere: string;
  tip: string;
  related: Related[];
  /** Time-sensitive points to re-check before release. Never shown as facts without checking. */
  reviewNeeded: string[];
};
export type Credit = {
  slug: string;
  title: string;
  source: string;
  author: string;
  licence: string;
  licenceUrl: string;
  attributionRequired: boolean;
  provider: string;
  file: string;
  width: number;
  height: number;
};

export const HUBS: { id: Hub; title: string; tl: string; intro: string }[] = [
  {
    id: "gta",
    title: "GTA & Nearby",
    tl: "Malapit lang",
    intro: "Day trips from Toronto and weekend getaways within a few hours' drive.",
  },
  {
    id: "abroad",
    title: "From the GTA",
    tl: "Mula sa GTA",
    intro: "Longer trips from Toronto Pearson, from a visit home to the Philippines to winter sun.",
  },
];

export const destinations = data.destinations as Destination[];
export const credits = creditData.credits as Credit[];
export const noPhoto = creditData.noPhoto as string[];

export const destination = (slug: string) => destinations.find((d) => d.slug === slug);
export const inHub = (hub: Hub) => destinations.filter((d) => d.hub === hub);
export const creditFor = (slug: string) => credits.find((c) => c.slug === slug);
export const travelPath = (d: Pick<Destination, "slug">) => `/travel/${d.slug}`;

export function seoTitle(d: Destination) {
  if (d.titleSeo) return d.titleSeo;
  return d.hub === "gta" ? `${d.name}: Day Trip from Toronto` : `Toronto to ${d.name} Travel Guide`;
}

/** Permanent slot id for the Featured travel ad on a destination page. Never rename: reports key off it. */
export const travelSlotId = (slug: string) => `travel-${slug}-featured-1`;

export function guideWordCount(d: Destination) {
  return [...d.guide, d.bestSeason, d.gettingThere, d.tip].join(" ").split(/\s+/).filter(Boolean).length;
}

/** Related directory modules: only categories that exist and have listings. Area filter falls back to all. */
export function relatedModules(d: Destination, max = 4): (Related & { name: string; items: PublicListing[] })[] {
  return d.related
    .map((r) => {
      const cat = publicCategories.find((c) => c.slug === r.category);
      if (!cat) return null;
      const all = publicIn(r.category);
      const local = r.area ? all.filter((l) => l.area === r.area) : [];
      const items = (local.length ? local : all).slice(0, max);
      return items.length ? { ...r, name: cat.name, items } : null;
    })
    .filter((x): x is Related & { name: string; items: PublicListing[] } => x !== null);
}

export function toCard(d: Destination) {
  const c = creditFor(d.slug);
  return {
    slug: d.slug,
    hub: d.hub,
    name: d.name,
    region: d.region,
    caption: d.summary,
    href: travelPath(d),
    photo: c ? { src: c.file, width: c.width, height: c.height, alt: `${d.name}, ${d.region}` } : undefined,
  };
}

/** Short attribution line, e.g. "Photo: Jane Doe, CC BY-SA 4.0, via Wikimedia Commons". */
export const creditLine = (c: Credit) => `Photo: ${c.author}, ${c.licence}, via ${c.provider}`;
