import "server-only";
import { db } from "@/lib/db";

/** First-party page views: daily aggregates only. The user agent is read to drop bots and pick a device class; never stored. */
export type Device = "mobile" | "tablet" | "desktop";
export const deviceOf = (ua: string): Device =>
  /ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)
    ? "tablet"
    : /mobi|iphone|android/i.test(ua)
      ? "mobile"
      : "desktop";

export function dayKey(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Toronto",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

/** Pathname only, no query; private areas are never counted. Returns null when not trackable. */
export function cleanPath(p: unknown): string | null {
  if (typeof p !== "string" || !p.startsWith("/") || p.length > 160) return null;
  const path = p.split(/[?#]/)[0]!.replace(/\/+$/, "") || "/";
  if (!/^\/[A-Za-z0-9\-_/.~%]*$/.test(path)) return null;
  if (/^\/(admin|stats|api|results)(\/|$)/.test(path)) return null;
  return path;
}

/** Referrer host only (never the full URL); own site and invalid values become "" (direct/internal). */
export function refHost(r: unknown, ownHost: string | null): string {
  if (typeof r !== "string" || !r) return "";
  try {
    const h = new URL(r).hostname.toLowerCase().replace(/^www\./, "");
    if (
      !h ||
      h.length > 80 ||
      (ownHost &&
        h ===
          ownHost
            .toLowerCase()
            .replace(/^www\./, "")
            .split(":")[0])
    )
      return "";
    return h;
  } catch {
    return "";
  }
}

export async function recordPageView(path: string, ref: string, device: Device): Promise<boolean> {
  const sql = db();
  if (!sql) return false;
  await sql.query(
    `insert into site_daily (day, path, ref_host, device, event, count) values ($1, $2, $3, $4, 'pageview', 1)
     on conflict (day, path, ref_host, device, event) do update set count = site_daily.count + 1`,
    [dayKey(), path, ref, device],
  );
  return true;
}

export type Range = { from: string; to: string };
const isDay = (s?: string) => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export function parseRange(from?: string, to?: string): Range {
  const end = isDay(to) ? to! : dayKey();
  const start = isDay(from) ? from! : dayKey(new Date(Date.parse(end) - 29 * 86400000));
  return start <= end ? { from: start, to: end } : { from: end, to: start };
}
const monthsOf = (r: Range) => [r.from.slice(0, 7), r.to.slice(0, 7)];

export type SiteSummary = {
  total: number;
  byDay: { day: string; n: number }[];
  topPages: { path: string; n: number }[];
  sources: { host: string; n: number }[];
  devices: { device: string; n: number }[];
  topListings: { listing_id: string; name: string | null; views: number; scans: number; clicks: number }[];
};

export async function siteSummary(r: Range): Promise<SiteSummary | null> {
  const sql = db();
  if (!sql) return null;
  const q = <T>(text: string, p: unknown[]) => sql.query(text, p) as Promise<T[]>;
  const [m1, m2] = monthsOf(r);
  const [tot, byDay, topPages, sources, devices, topListings] = await Promise.all([
    q<{ n: string }>(`select coalesce(sum(count),0) n from site_daily where day between $1 and $2`, [r.from, r.to]),
    q<{ day: string; n: string }>(
      `select to_char(day,'YYYY-MM-DD') as day, sum(count) n from site_daily where day between $1 and $2 group by day order by day`,
      [r.from, r.to],
    ),
    q<{ path: string; n: string }>(
      `select path, sum(count) n from site_daily where day between $1 and $2 group by path order by n desc, path limit 25`,
      [r.from, r.to],
    ),
    q<{ host: string; n: string }>(
      `select ref_host as host, sum(count) n from site_daily where day between $1 and $2 group by ref_host order by n desc limit 15`,
      [r.from, r.to],
    ),
    q<{ device: string; n: string }>(
      `select device, sum(count) n from site_daily where day between $1 and $2 group by device order by n desc`,
      [r.from, r.to],
    ),
    q<{ listing_id: string; name: string | null; views: string; scans: string; clicks: string }>(
      `select s.listing_id, l.name,
         sum(n) filter (where event='view') views, sum(n) filter (where event='scan') scans,
         sum(n) filter (where event in ('call','map','website','tap')) clicks
       from listing_stats s left join listings l on l.listing_id = s.listing_id
       where s.month between $1 and $2 group by s.listing_id, l.name order by views desc nulls last limit 20`,
      [m1, m2],
    ),
  ]);
  const N = (x: string | number | null) => Number(x ?? 0);
  return {
    total: N(tot[0]?.n ?? 0),
    byDay: byDay.map((x) => ({ day: x.day, n: N(x.n) })),
    topPages: topPages.map((x) => ({ path: x.path, n: N(x.n) })),
    sources: sources.map((x) => ({ host: x.host || "(direct / internal)", n: N(x.n) })),
    devices: devices.map((x) => ({ device: x.device, n: N(x.n) })),
    topListings: topListings.map((x) => ({ ...x, views: N(x.views), scans: N(x.scans), clicks: N(x.clicks) })),
  };
}
