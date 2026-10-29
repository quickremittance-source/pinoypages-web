/** GTA areas for Filipino Foodie. Region-agnostic shape so other regions can be added later (region = "gta"). */
export const FOODIE_REGION = "gta" as const;
export type Area = { slug: string; name: string };
export const AREAS: Area[] = [
  { slug: "toronto", name: "Toronto" },
  { slug: "little-manila", name: "Little Manila" },
  { slug: "scarborough", name: "Scarborough" },
  { slug: "north-york", name: "North York" },
  { slug: "etobicoke", name: "Etobicoke" },
  { slug: "mississauga", name: "Mississauga" },
  { slug: "brampton", name: "Brampton" },
  { slug: "vaughan", name: "Vaughan" },
  { slug: "markham", name: "Markham" },
  { slug: "richmond-hill", name: "Richmond Hill" },
  { slug: "ajax-pickering", name: "Ajax/Pickering" },
  { slug: "oshawa-whitby", name: "Oshawa/Whitby" },
  { slug: "oakville-milton", name: "Oakville/Milton" },
];
export const areaName = (slug: string) => AREAS.find((a) => a.slug === slug)?.name ?? slug;

/** Map a restaurant's city/neighbourhood to an area slug (rough; refine with a neighbourhood polygon later). */
export function areaOf(city: string | null, neighbourhood: string | null): string | null {
  const c = (city ?? "").toLowerCase();
  const n = (neighbourhood ?? "").toLowerCase();
  if (/manila|bathurst/.test(n)) return "little-manila";
  if (c.startsWith("toronto")) return "toronto";
  if (c.startsWith("scarborough")) return "scarborough";
  if (c.startsWith("north york")) return "north-york";
  if (c.startsWith("etobicoke")) return "etobicoke";
  if (c.startsWith("mississauga")) return "mississauga";
  if (c.startsWith("brampton")) return "brampton";
  if (c.startsWith("vaughan")) return "vaughan";
  if (c.startsWith("markham")) return "markham";
  if (c.startsWith("richmond hill")) return "richmond-hill";
  if (/^(ajax|pickering)/.test(c)) return "ajax-pickering";
  if (/^(oshawa|whitby)/.test(c)) return "oshawa-whitby";
  if (/^(oakville|milton)/.test(c)) return "oakville-milton";
  return null;
}

/** Approximate postal-code FSA (first 3 chars) to area. Static table; no geolocation, no third-party lookups. */
const FSA_RULES: [RegExp, string][] = [
  [/^M(3H|3K|6A|6B|3J)$/, "little-manila"],
  [/^M1/, "scarborough"],
  [/^M[23]/, "north-york"],
  [/^M[89]/, "etobicoke"],
  [/^M[4-7]/, "toronto"],
  [/^L(4T|4V|4W|4X|4Y|4Z|5[A-W])$/, "mississauga"],
  [/^L(6[P-Z]|7A)$/, "brampton"],
  [/^L(4[HJKL]|6A|0J)$/, "vaughan"],
  [/^L(3[PRST]|6[BCEG])$/, "markham"],
  [/^L4[BCES]$/, "richmond-hill"],
  [/^L1[STVWXYZ]$/, "ajax-pickering"],
  [/^L1[G-R]$/, "oshawa-whitby"],
  [/^L(6[HJKLM]|9T|9E)$/, "oakville-milton"],
];
export function areaForPostal(postal: string): string | null {
  const fsa = postal.replace(/\s/g, "").toUpperCase().slice(0, 3);
  if (!/^[A-Z]\d[A-Z]$/.test(fsa)) return null;
  return FSA_RULES.find(([re]) => re.test(fsa))?.[1] ?? null;
}
