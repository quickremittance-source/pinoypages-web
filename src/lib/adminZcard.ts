/** Pure parsing/validation for the private /admin/zcard workspace (no DB, unit-tested). */
import { daysIn, fill } from "@/lib/dashRange";

export const ZCARD_TABS = ["analytics", "qr", "landing", "listing"] as const;
export type ZcardTab = (typeof ZCARD_TABS)[number];

export const parseTab = (v?: string | null): ZcardTab =>
  (ZCARD_TABS as readonly string[]).includes(v ?? "") ? (v as ZcardTab) : "analytics";

export const zcardQrUrl = (slug: string, code: string) => `https://pinoypages.ca/zcard/${slug}?src=qr&t=${code}`;

export const ANALYTICS_NOTE =
  "These are scan, view or click counts — not unique visitors or sales. Calendar days use America/Toronto boundaries. Per-code figures come from monthly ad tracking IDs (ad_event_counts). Daily totals are for the whole ZCard (ad_event_daily). If a directory listing is linked, its printed QR scans appear separately, grouped by code and Toronto day (qr_scan_daily).";

export function parseQrLabel(raw: string): string {
  const label = raw.trim().slice(0, 80);
  if (!label) throw new Error("label is required");
  return label;
}

/** Collision-safe tracking id: 4–12 lowercase alphanumeric, matching ad_tracking_ids. */
export function makeTrackingId(label: string, taken: Iterable<string>): string {
  const base = (
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .slice(0, 10) || "code"
  )
    .padEnd(4, "x")
    .slice(0, 10);
  const existing = new Set(taken);
  if (!existing.has(base)) return base;
  for (let i = 2; i < 1000; i++) {
    const suffix = String(i);
    const id = `${base.slice(0, 12 - suffix.length)}${suffix}`;
    if (!existing.has(id)) return id;
  }
  throw new Error("could not allocate a tracking id");
}

export type LandingPatch = {
  name: string;
  tagline: string;
  offer: string;
  services: string[];
  phone: string;
  whatsapp: string | null;
  website: string | null;
  mapQuery: string;
};

type Get = { get(k: string): FormDataEntryValue | null };
const str = (fd: Get, k: string, max: number) =>
  String(fd.get(k) ?? "")
    .trim()
    .slice(0, max);

export function parseLandingForm(fd: Get): LandingPatch {
  const name = str(fd, "name", 200);
  if (!name) throw new Error("name is required");
  const phone = str(fd, "phone", 40);
  if (!phone) throw new Error("phone is required");
  const mapQuery = str(fd, "mapQuery", 200);
  if (!mapQuery) throw new Error("mapQuery is required");
  const websiteRaw = str(fd, "website", 300);
  if (websiteRaw && !/^https?:\/\/[^\s]+$/i.test(websiteRaw))
    throw new Error("website must start with http:// or https://");
  const whatsapp = str(fd, "whatsapp", 20).replace(/[()\s-]/g, "") || null;
  if (whatsapp && !/^\+?[0-9]{7,15}$/.test(whatsapp)) throw new Error("whatsapp must be digits");
  const services = str(fd, "services", 4000)
    .split(/\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((s) => s.slice(0, 200));
  return {
    name,
    tagline: str(fd, "tagline", 300),
    offer: str(fd, "offer", 2000),
    services,
    phone,
    whatsapp,
    website: websiteRaw || null,
    mapQuery,
  };
}

export type ListingAction = { op: "link"; listingId: string } | { op: "unlink" };

export function parseListingAction(fd: Get): ListingAction {
  const op = String(fd.get("op") ?? "");
  if (op === "unlink") {
    if (fd.get("confirm") !== "on") {
      throw new Error("Tick the box to confirm unlinking. The listing, ad, QR codes and analytics stay in place.");
    }
    return { op: "unlink" };
  }
  if (op === "link") {
    const listingId = str(fd, "listing_id", 80);
    if (!listingId) throw new Error("listing_id is required");
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(listingId)) throw new Error("listing_id looks invalid");
    return { op: "link", listingId };
  }
  throw new Error("bad op");
}

export type DailyPoint = { day: string; n: number };
export type CodeSeries = { code: string; label: string; days: DailyPoint[]; total: number };

/** Group sparse {code, day, n} rows into a Toronto-day series per code (zero-filled). */
export function groupByCodeDay(
  rows: { code: string; label?: string; day: string; n: number }[],
  from: string,
  to: string,
): CodeSeries[] {
  const days = daysIn(from, to);
  const byCode = new Map<string, { label: string; pts: DailyPoint[] }>();
  for (const r of rows) {
    const o = byCode.get(r.code) ?? { label: r.label || r.code, pts: [] };
    if (r.label) o.label = r.label;
    o.pts.push({ day: r.day, n: Number(r.n) || 0 });
    byCode.set(r.code, o);
  }
  return [...byCode.entries()]
    .map(([code, o]) => {
      const filled = fill(days, o.pts);
      return { code, label: o.label, days: filled, total: filled.reduce((s, d) => s + d.n, 0) };
    })
    .sort((a, b) => b.total - a.total || a.code.localeCompare(b.code));
}
