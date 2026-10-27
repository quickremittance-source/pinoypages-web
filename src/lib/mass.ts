import {
  approvedEvents,
  bi,
  filterEvents,
  needsOrganizerConfirm,
  parseEventFilters,
  sortByStart,
  type CommunityEvent,
  type EventCity,
} from "@/lib/events";

export { bi, needsOrganizerConfirm, type EventCity };

/** Church / Simbang Gabi events from content/events.json (approved only). */
export function massEvents(): CommunityEvent[] {
  return approvedEvents()
    .filter((e) => e.category === "church")
    .slice()
    .sort(sortByStart);
}

export function isSimbangGabi(e: CommunityEvent): boolean {
  return /simbang\s*gabi/i.test(e.title) || /simbang\s*gabi/i.test(e.description ?? "");
}

export type MassFilters = {
  city: string;
  simbang: boolean;
  q: string;
};

export function parseMassFilters(sp: Record<string, string | string[] | undefined>): MassFilters {
  const base = parseEventFilters(sp);
  const simbang = String(Array.isArray(sp.simbang) ? sp.simbang[0] : (sp.simbang ?? "")) === "1";
  const q = String(Array.isArray(sp.q) ? sp.q[0] : (sp.q ?? "")).trim();
  return { city: base.city, simbang, q };
}

export function filterMassEvents(events: CommunityEvent[], f: MassFilters): CommunityEvent[] {
  let list = filterEvents(events, { city: f.city, category: "church" });
  if (f.simbang) list = list.filter(isSimbangGabi);
  if (f.q) {
    const needle = f.q.toLowerCase();
    list = list.filter(
      (e) =>
        e.title.toLowerCase().includes(needle) ||
        e.venue.toLowerCase().includes(needle) ||
        (e.address ?? "").toLowerCase().includes(needle) ||
        (e.description ?? "").toLowerCase().includes(needle),
    );
  }
  return list.sort(sortByStart);
}

export const MASS_COPY = {
  kicker: { en: "Mass finder", tl: "Hanapin ang Misa" },
  title: { en: "Filipino Mass & Simbang Gabi", tl: "Misang Pilipino at Simbang Gabi" },
  intro: {
    en: "Filipino Masses and Simbang Gabi from the Pinoy Pages events calendar. Times marked “expected” still need confirmation with the parish.",
    tl: "Mga Misang Pilipino at Simbang Gabi mula sa kalendaryo ng Pinoy Pages. Ang may markang “expected” ay kailangan pang kumpirmahin sa parokya.",
  },
  empty: {
    en: "No Masses match these filters. Browse all events or submit one for review.",
    tl: "Walang Misang tumutugma sa mga filter. Tingnan ang lahat ng kaganapan o magsumite para sa pagsusuri.",
  },
  simbangOnly: { en: "Simbang Gabi only", tl: "Simbang Gabi lamang" },
  allMasses: { en: "All Filipino Masses", tl: "Lahat ng Misang Pilipino" },
  city: { en: "City", tl: "Lungsod" },
  search: { en: "Search", tl: "Maghanap" },
  source: { en: "Source", tl: "Pinagmulan" },
  expected: { en: "Expected, confirm with organizer", tl: "Inaasahan — kumpirmahin sa organizer" },
} as const;
