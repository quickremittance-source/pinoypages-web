import data from "../../content/events.json";
import { abs } from "@/lib/guide";
import { publicListings, type PublicListing } from "@/lib/public";
import { bizPath } from "@/lib/seo";
import { monthGrid as calMonthGrid } from "@/lib/cal";

/** Cities shown in filters and the submit form. */
export const EVENT_CITIES = [
  "GTA",
  "Winnipeg",
  "Calgary",
  "Edmonton",
  "Vancouver",
  "Montreal",
  "Ottawa",
  "Other",
] as const;
export type EventCity = (typeof EVENT_CITIES)[number];

/** Categories: English label + proper Tagalog secondary (not Taglish). */
export const EVENT_CATEGORIES = {
  fiesta: { en: "Fiesta / Festival", tl: "Pista" },
  church: { en: "Church / Simbang Gabi", tl: "Simbahan / Simbang Gabi" },
  community: { en: "Community", tl: "Pamayanan" },
  business: { en: "Business", tl: "Negosyo" },
  cultural: { en: "Cultural", tl: "Kultura" },
} as const;
export type EventCategory = keyof typeof EVENT_CATEGORIES;

export type CommunityEventStatus = "approved" | "pending";

/** How sure we are of the listing. Badge when expected | recurring | low. */
export type SourceConfidence = "confirmed" | "expected" | "recurring" | "low";

export type CommunityEvent = {
  id: string;
  slug: string;
  title: string;
  start: string;
  end: string;
  timezone: string;
  city: EventCity;
  category: EventCategory;
  venue: string;
  address?: string;
  description?: string;
  ticketUrl?: string;
  listingId?: string;
  /** Organizer or listing page that confirmed the event. Required for public events. */
  sourceUrl?: string;
  sourceConfidence?: SourceConfidence;
  status: CommunityEventStatus;
};

/** Show the "Expected, confirm with organizer" badge. */
export function needsOrganizerConfirm(e: CommunityEvent): boolean {
  return e.sourceConfidence === "expected" || e.sourceConfidence === "recurring" || e.sourceConfidence === "low";
}

type FileShape = { schemaVersion?: number; events: CommunityEvent[] };

const file = data as FileShape;

/** All rows from content/events.json (including pending). Prefer approvedEvents() for public pages. */
export const allCommunityEvents = (file.events ?? []) as CommunityEvent[];

/** Public catalogue: approved only. Empty until real events are added. */
export function approvedEvents(): CommunityEvent[] {
  return allCommunityEvents.filter((e) => e.status === "approved");
}

export function eventBySlug(slug: string): CommunityEvent | undefined {
  return approvedEvents().find((e) => e.slug === slug);
}

export function listingForEvent(e: CommunityEvent): PublicListing | undefined {
  if (!e.listingId) return undefined;
  return publicListings.find((l) => l.listing_id === e.listingId || l.id === e.listingId);
}

export function listingHref(e: CommunityEvent): string | undefined {
  const l = listingForEvent(e);
  return l ? bizPath(l) : undefined;
}

export type EventFilters = {
  city: string;
  category: string;
  view: "list" | "month";
  month: string; // YYYY-MM
};

export function parseEventFilters(sp: Record<string, string | string[] | undefined> | URLSearchParams): EventFilters {
  const get = (k: string) => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? "";
    const v = sp[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  const view = get("view") === "month" ? "month" : "list";
  const now = new Date();
  const defaultMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const monthRaw = get("month").trim();
  const month = /^\d{4}-\d{2}$/.test(monthRaw) ? monthRaw : defaultMonth;
  return {
    city: get("city").trim(),
    category: get("category").trim(),
    view,
    month,
  };
}

export function filterEvents(events: CommunityEvent[], f: Pick<EventFilters, "city" | "category">): CommunityEvent[] {
  return events.filter((e) => {
    if (f.city && e.city !== f.city) return false;
    if (f.category && e.category !== f.category) return false;
    return true;
  });
}

export function eventsHref(f: Partial<EventFilters>): string {
  const p = new URLSearchParams();
  if (f.city) p.set("city", f.city);
  if (f.category) p.set("category", f.category);
  if (f.view && f.view !== "list") p.set("view", f.view);
  if (f.month) p.set("month", f.month);
  const qs = p.toString();
  return qs ? `/events?${qs}` : "/events";
}

export function sortByStart(a: CommunityEvent, b: CommunityEvent) {
  return a.start.localeCompare(b.start);
}

export function monthKeyOfEvent(e: CommunityEvent) {
  return e.start.slice(0, 7);
}

export function eventsInMonth(events: CommunityEvent[], month: string) {
  return events.filter((e) => monthKeyOfEvent(e) === month).sort(sortByStart);
}

export const monthGrid = calMonthGrid;

export function categoryLabel(cat: EventCategory, bilingual = true) {
  const c = EVENT_CATEGORIES[cat];
  return bilingual ? `${c.en} · ${c.tl}` : c.en;
}

/** Local datetime parts from "YYYY-MM-DDTHH:mm:ss" (no offset). */
function parts(isoLocal: string) {
  const [d = "", t = "00:00:00"] = isoLocal.split("T");
  const [y, mo, day] = d.split("-").map(Number);
  const [h, mi, s] = t.split(":").map(Number);
  return { y: y!, mo: mo!, day: day!, h: h ?? 0, mi: mi ?? 0, s: s ?? 0, date: d, time: t.slice(0, 5) };
}

export function formatEventWhen(e: CommunityEvent, locale = "en-CA") {
  const s = parts(e.start);
  const startDate = new Date(Date.UTC(s.y, s.mo - 1, s.day, s.h, s.mi, s.s));
  const date = startDate.toLocaleDateString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const time = `${s.time}${e.end ? ` – ${parts(e.end).time}` : ""}`;
  return { date, time, timezone: e.timezone };
}

export function mapsUrl(e: CommunityEvent) {
  const q = [e.venue, e.address, e.city === "GTA" ? "Toronto ON" : e.city, "Canada"].filter(Boolean).join(", ");
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Google Calendar template link (floating local times + ctz). */
export function googleCalendarUrl(e: CommunityEvent) {
  const fmt = (iso: string) => {
    const p = parts(iso);
    return `${p.date.replace(/-/g, "")}T${String(p.h).padStart(2, "0")}${String(p.mi).padStart(2, "0")}${String(p.s).padStart(2, "0")}`;
  };
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: e.title,
    dates: `${fmt(e.start)}/${fmt(e.end)}`,
    ctz: e.timezone,
    details: [e.description ?? "", abs(`/events/${e.slug}`)].filter(Boolean).join("\n\n"),
    location: [e.venue, e.address].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");
const fold = (line: string) => line.match(/.{1,73}/g)!.join("\r\n ");

/** RFC 5545 .ics for one community event. */
export function communityEventIcs(
  e: CommunityEvent,
  stamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d+Z$/, "Z"),
) {
  const fmt = (iso: string) => {
    const p = parts(iso);
    return `${p.date.replace(/-/g, "")}T${String(p.h).padStart(2, "0")}${String(p.mi).padStart(2, "0")}${String(p.s).padStart(2, "0")}`;
  };
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pinoy Pages//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${e.id}@pinoypages.ca`,
    `DTSTAMP:${stamp}`,
    `DTSTART;TZID=${e.timezone}:${fmt(e.start)}`,
    `DTEND;TZID=${e.timezone}:${fmt(e.end)}`,
    `SUMMARY:${esc(e.title)}`,
    `LOCATION:${esc([e.venue, e.address].filter(Boolean).join(", "))}`,
    `DESCRIPTION:${esc([e.description ?? "", abs(`/events/${e.slug}`)].filter(Boolean).join("\\n"))}`,
    `URL:${abs(`/events/${e.slug}`)}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ];
  return lines.map(fold).join("\r\n") + "\r\n";
}

/** schema.org Event JSON-LD. */
export function eventJsonLd(e: CommunityEvent) {
  const loc: Record<string, unknown> = {
    "@type": "Place",
    name: e.venue,
  };
  if (e.address) {
    loc.address = {
      "@type": "PostalAddress",
      streetAddress: e.address,
      addressLocality: e.city === "GTA" ? "Toronto" : e.city,
      addressCountry: "CA",
    };
  }
  const ld: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    startDate: e.start,
    endDate: e.end,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: loc,
    url: abs(`/events/${e.slug}`),
  };
  if (e.description) ld.description = e.description;
  if (e.ticketUrl) {
    ld.offers = {
      "@type": "Offer",
      url: e.ticketUrl,
      availability: "https://schema.org/InStock",
    };
  }
  return ld;
}

/** Bilingual UI copy (English primary, Tagalog secondary). */
export const EVENTS_COPY = {
  kicker: { en: "Events", tl: "Mga Kaganapan" },
  title: { en: "Filipino community events", tl: "Mga kaganapan ng pamayanang Filipino" },
  intro: {
    en: "Fiestas, Simbang Gabi, cultural nights and business gatherings across Canada. Submit an event for review — nothing is published without approval.",
    tl: "Mga pista, Simbang Gabi, gabi ng kultura at tipon ng negosyo sa Canada. Magsumite ng kaganapan para sa pagsusuri — walang nailalathala nang walang pagsang-ayon.",
  },
  empty: {
    en: "No upcoming events yet. Submit yours.",
    tl: "Wala pang paparating na kaganapan. Magsumite ng sa inyo.",
  },
  listView: { en: "List", tl: "Listahan" },
  monthView: { en: "Month", tl: "Buwan" },
  submit: { en: "Submit an event", tl: "Magsumite ng kaganapan" },
  addToCalendar: { en: "Add to calendar", tl: "Idagdag sa kalendaryo" },
  googleCal: { en: "Google Calendar", tl: "Google Calendar" },
  map: { en: "Map", tl: "Mapa" },
  tickets: { en: "Tickets / RSVP", tl: "Mga tiket / RSVP" },
  listing: { en: "Pinoy Pages listing", tl: "Listahan sa Pinoy Pages" },
  city: { en: "City", tl: "Lungsod" },
  category: { en: "Category", tl: "Kategorya" },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
