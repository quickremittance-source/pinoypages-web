import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { daysIn, fill, windowOf, type RangeDays } from "@/lib/dashRange";

type Row = Record<string, string | number | boolean | null>;
const N = (x: unknown) => Number(x ?? 0);
const series = (rows: Row[]) => rows.map((r) => ({ day: String(r.day), n: N(r.n) }));
const top = (rows: Row[], k: string) => rows.map((r) => ({ label: String(r[k] ?? "—"), n: N(r.n) }));

export type Overview = Awaited<ReturnType<typeof loadOverview>>;

async function loadOverview(days: RangeDays) {
  const sql = db();
  if (!sql) return null;
  const { from, to } = windowOf(days);
  const all = daysIn(from, to);
  const q = (t: string) => sql.query(t, [from, to]) as Promise<Row[]>;
  const [pv, pages, biz, cats, search, topQ, le, cities, topL, inq, qr, card, ad] = await Promise.all([
    q(`select to_char(day,'YYYY-MM-DD') as day, sum(count) n from site_daily where day between $1 and $2 group by 1`),
    q(`select path, sum(count) n from site_daily where day between $1 and $2 group by 1 order by 2 desc, 1 limit 10`),
    q(`select path, sum(count) n from site_daily where day between $1 and $2 and path like '/business/%' group by 1 order by 2 desc, 1 limit 10`),
    q(`select split_part(path,'/',3) cat, sum(count) n from site_daily where day between $1 and $2 and path like '/directory/%' group by 1 order by 2 desc limit 10`),
    q(`select to_char(day,'YYYY-MM-DD') as day, sum(n) n from search_log where day between $1 and $2 group by 1`),
    q(`select query, sum(n) n from search_log where day between $1 and $2 group by 1 order by 2 desc, 1 limit 10`),
    q(`select to_char(day,'YYYY-MM-DD') as day, event, sum(n) n from listing_event_daily where day between $1 and $2 group by 1,2`),
    q(`select coalesce(l.area,'—') area, sum(e.n) n from listing_event_daily e left join listings l on l.listing_id=e.listing_id where e.day between $1 and $2 group by 1 order by 2 desc limit 10`),
    q(`select coalesce(l.name,e.listing_id) name, sum(e.n) filter (where event='view') n from listing_event_daily e left join listings l on l.listing_id=e.listing_id where e.day between $1 and $2 group by 1 order by 2 desc nulls last limit 10`),
    q(`select kind, status, count(*) n from inquiries where (created_at at time zone 'America/Toronto')::date between $1 and $2 group by 1,2 order by 3 desc`),
    q(`select to_char(day,'YYYY-MM-DD') as day, sum(n) n from qr_scan_daily where day between $1 and $2 group by 1`),
    q(`select to_char(day,'YYYY-MM-DD') as day, sum(count) n from site_daily where day between $1 and $2 and path like '/card/%' group by 1`),
    q(`select event, sum(n) n from ad_event_daily where day between $1 and $2 group by 1`),
  ]);
  const ev = (e: string) => fill(all, le.filter((r) => r.event === e).map((r) => ({ day: String(r.day), n: N(r.n) })));
  const sum = (s: { n: number }[]) => s.reduce((a, r) => a + r.n, 0);
  const pageviews = fill(all, series(pv));
  const searches = fill(all, series(search));
  const listingViews = ev("view");
  const qrScans = fill(all, series(qr));
  const zcardViews = fill(all, series(card));
  const adEv = Object.fromEntries(ad.map((r) => [String(r.event), N(r.n)]));
  return {
    from,
    to,
    totals: {
      pageviews: sum(pageviews),
      searches: sum(searches),
      listingViews: sum(listingViews),
      qrScans: sum(qrScans),
      zcardViews: sum(zcardViews) + (adEv.impression ?? 0),
      contactClicks: ["call", "map", "website", "tap"].reduce((a, e) => a + sum(ev(e)), 0),
      inquiries: inq.reduce((a, r) => a + N(r.n), 0),
    },
    pageviews,
    searches,
    listingViews,
    qrScans,
    zcardViews,
    topPages: top(pages, "path"),
    topBusinessPages: top(biz, "path"),
    topCategories: top(cats, "cat"),
    topCities: top(cities, "area"),
    topListings: top(topL, "name"),
    topSearches: top(topQ, "query"),
    inquiries: inq.map((r) => ({ label: `${r.kind} · ${r.status}`, n: N(r.n) })),
    adEvents: adEv,
  };
}
/** Cached 5 minutes per range: one round of parallel queries, then served from the Next data cache. */
export const getOverview = (days: RangeDays) =>
  unstable_cache(() => loadOverview(days), ["dash-overview-v2", String(days)], { revalidate: 300, tags: ["dash"] })();

async function loadQr(days: RangeDays, advertiserId?: string) {
  const sql = db();
  if (!sql) return null;
  const { from, to } = windowOf(days);
  const all = daysIn(from, to);
  const p: unknown[] = [from, to];
  // Advertiser scope: codes they own, plus codes on their linked listings.
  const scope = "(c.advertiser_id = $3 or c.listing_id in (select listing_id from advertiser_listings where advertiser_id = $3))";
  const where = advertiserId ? (p.push(advertiserId), `where ${scope}`) : "";
  const [codes, daily] = await Promise.all([
    sql.query(
      `select c.code, c.placement, c.target_url, c.active, c.listing_id, coalesce(sum(s.n) filter (where s.day between $1 and $2),0) n,
              coalesce(sum(s.n),0) lifetime
         from qr_codes c left join qr_scan_daily s on s.code = c.code ${where} group by c.code order by c.listing_id nulls last, n desc, c.code limit 500`,
      p,
    ) as Promise<Row[]>,
    sql.query(
      `select s.code, to_char(s.day,'YYYY-MM-DD') as day, sum(s.n) n from qr_scan_daily s join qr_codes c on c.code = s.code
        where s.day between $1 and $2 ${advertiserId ? `and ${scope}` : ""} group by 1,2`,
      p,
    ) as Promise<Row[]>,
  ]);
  return {
    from,
    to,
    codes: codes.map((c) => ({
      code: String(c.code),
      placement: String(c.placement ?? ""),
      target: String(c.target_url ?? ""),
      active: c.active === true || c.active === "true",
      listing: c.listing_id ? String(c.listing_id) : "",
      n: N(c.n),
      lifetime: N(c.lifetime),
      series: fill(all, daily.filter((d) => d.code === c.code).map((d) => ({ day: String(d.day), n: N(d.n) }))),
    })),
    byListing: Object.values(
      codes.reduce<Record<string, { listing: string; codes: number; n: number; lifetime: number }>>((a, c) => {
        const k = c.listing_id ? String(c.listing_id) : "(no listing)";
        const r = (a[k] ??= { listing: k, codes: 0, n: 0, lifetime: 0 });
        r.codes += 1;
        r.n += N(c.n);
        r.lifetime += N(c.lifetime);
        return a;
      }, {}),
    ).sort((x, y) => y.n - x.n),
    total: fill(all, Object.entries(daily.reduce<Record<string, number>>((a, d) => ((a[String(d.day)] = (a[String(d.day)] ?? 0) + N(d.n)), a), {})).map(([day, n]) => ({ day, n }))),
  };
}
export const getQrDashboard = (days: RangeDays, advertiserId?: string) =>
  unstable_cache(() => loadQr(days, advertiserId), ["dash-qr-v3", String(days), advertiserId ?? "all"], {
    revalidate: 300,
    tags: ["dash"],
  })();

/** One advertiser's daily performance. Every query is filtered by that advertiser id; nothing else is returned. */
async function loadAdvertiserDaily(advertiserId: string, days: RangeDays) {
  const sql = db();
  if (!sql) return null;
  const { from, to } = windowOf(days);
  const all = daysIn(from, to);
  const p = [from, to, advertiserId];
  const [ads, listing] = await Promise.all([
    sql.query(
      `select to_char(e.day,'YYYY-MM-DD') as day, e.event, sum(e.n) n from ad_event_daily e
        where e.day between $1 and $2 and (e.ad_ref in (select id from zcards where advertiser_id = $3)
              or e.ad_ref in (select id::text from ads where advertiser_id = $3)) group by 1,2`,
      p,
    ) as Promise<Row[]>,
    sql.query(
      `select to_char(e.day,'YYYY-MM-DD') as day, e.event, sum(e.n) n from listing_event_daily e
        where e.day between $1 and $2 and e.listing_id in (select listing_id from advertiser_listings where advertiser_id = $3) group by 1,2`,
      p,
    ) as Promise<Row[]>,
  ]);
  const pick = (rows: Row[], evs: string[]) =>
    fill(all, Object.entries(rows.filter((r) => evs.includes(String(r.event))).reduce<Record<string, number>>((a, r) => ((a[String(r.day)] = (a[String(r.day)] ?? 0) + N(r.n)), a), {})).map(([day, n]) => ({ day, n })));
  return {
    from,
    to,
    views: pick([...ads, ...listing], ["impression", "view"]),
    clicks: pick(ads, ["click"]),
    contacts: pick(listing, ["call", "map", "website", "tap"]),
  };
}
export const getAdvertiserDaily = (advertiserId: string, days: RangeDays) =>
  unstable_cache(() => loadAdvertiserDaily(advertiserId, days), ["dash-adv-v2", advertiserId, String(days)], {
    revalidate: 300,
    tags: ["dash"],
  })();
