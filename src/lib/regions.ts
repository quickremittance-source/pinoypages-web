/**
 * Regions. Pinoy Pages launches in the Greater Toronto Area only; more regions later.
 * - DEFAULT_REGION is used everywhere a region is implied (all current URLs stay as they are).
 * - /gta/... is an optional alias for the same pages (rewrite in next.config.ts); QR and old paths are unchanged.
 * - The region switcher stays hidden until a second region is enabled.
 * - zcard is region-neutral on purpose: no region filter or region copy.
 */
export type RegionSlug = "gta";
export type Region = {
  slug: RegionSlug;
  name: string;
  short: string;
  province: string;
  enabled: boolean;
  /** Municipalities and former-city districts used for city filters, in display order. */
  cities: readonly string[];
};

export const REGIONS: Record<RegionSlug, Region> = {
  gta: {
    slug: "gta",
    name: "Greater Toronto Area",
    short: "GTA",
    province: "ON",
    enabled: true,
    cities: [
      "Toronto",
      "Scarborough",
      "North York",
      "Etobicoke",
      "East York",
      "York",
      "Mississauga",
      "Brampton",
      "Caledon",
      "Markham",
      "Vaughan",
      "Richmond Hill",
      "Aurora",
      "Newmarket",
      "King",
      "Whitchurch-Stouffville",
      "East Gwillimbury",
      "Georgina",
      "Oakville",
      "Burlington",
      "Milton",
      "Halton Hills",
      "Pickering",
      "Ajax",
      "Whitby",
      "Oshawa",
      "Clarington",
      "Uxbridge",
      "Scugog",
      "Brock",
    ],
  },
};
export const DEFAULT_REGION: RegionSlug = "gta";
export const region = (slug: RegionSlug = DEFAULT_REGION) => REGIONS[slug];
export const enabledRegions = () => Object.values(REGIONS).filter((r) => r.enabled);
/** Only shown once more than one region is live. */
export const showRegionSwitcher = () => enabledRegions().length > 1;
export const regionLabel = (slug: RegionSlug = DEFAULT_REGION) => `${REGIONS[slug].name} (${REGIONS[slug].short})`;

/** True when a city/area belongs to the region (case-insensitive). */
export const inRegion = (city: string | null | undefined, slug: RegionSlug = DEFAULT_REGION) =>
  !!city && REGIONS[slug].cities.some((c) => c.toLowerCase() === city.trim().toLowerCase());
/** Sort cities by the region's display order; unknown cities go last alphabetically. */
export function sortCities(list: string[], slug: RegionSlug = DEFAULT_REGION) {
  const order = REGIONS[slug].cities.map((c) => c.toLowerCase());
  const i = (c: string) => {
    const k = order.indexOf(c.toLowerCase());
    return k < 0 ? 999 : k;
  };
  return [...list].sort((a, b) => i(a) - i(b) || a.localeCompare(b));
}

/**
 * Site sections and their region scope. "live" exists on main today; "planned" sections use the same model when built.
 * zcard is deliberately region-neutral (null).
 */
export const SECTION_REGIONS: Record<string, { path: string; status: "live" | "planned"; region: RegionSlug | null }> =
  {
    directory: { path: "/directory", status: "live", region: "gta" },
    events: { path: "/calendar", status: "live", region: "gta" },
    magazine: { path: "/magazine", status: "live", region: "gta" },
    tools: { path: "/tools", status: "live", region: "gta" },
    advertise: { path: "/advertise", status: "live", region: "gta" },
    food: { path: "/food", status: "planned", region: "gta" },
    explore: { path: "/explore", status: "planned", region: "gta" },
    travel: { path: "/explore/travel", status: "planned", region: "gta" },
    zcard: { path: "/zcard", status: "planned", region: null },
  };
