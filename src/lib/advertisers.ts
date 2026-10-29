import "server-only";
import { db } from "@/lib/db";

export const ADV_TIER_LABEL: Record<string, string> = {
  verified: "Kabayan Verified ($99/yr + HST)",
  verified_plus: "Kabayan Verified++ (rates on request)",
  ads_only: "Ads (rates on request)",
};
export type Advertiser = {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  tier: string;
  ad_sizes: string[];
  status: string;
  start_date: string | null;
  end_date: string | null;
  is_demo: boolean;
  stats_token: string;
  listing_ids: string[];
  ads: { slug: string; tier: string; status: string }[];
};
const SELECT = `select v.id, v.business_name, v.contact_name, v.contact_email, v.contact_phone, v.tier, v.ad_sizes, v.status,
  to_char(v.start_date,'YYYY-MM-DD') start_date, to_char(v.end_date,'YYYY-MM-DD') end_date, v.is_demo, v.stats_token,
  coalesce((select array_agg(listing_id order by listing_id) from advertiser_listings x where x.advertiser_id = v.id), '{}') listing_ids,
  coalesce((select json_agg(json_build_object('slug', a.slug, 'tier', a.tier, 'status', a.status) order by a.slug)
    from ads a where a.advertiser_id = v.id), '[]') ads
  from advertisers v`;

export async function listAdvertisers(): Promise<Advertiser[] | null> {
  const sql = db();
  if (!sql) return null;
  return (await sql.query(`${SELECT} order by v.is_demo, v.business_name`)) as Advertiser[];
}

export const isStatsToken = (t: string) => /^[a-f0-9]{36}$/.test(t);
export async function advertiserByToken(token: string): Promise<Advertiser | null> {
  const sql = db();
  if (!sql || !isStatsToken(token)) return null;
  const rows = (await sql.query(`${SELECT} where v.stats_token = $1`, [token])) as Advertiser[];
  return rows[0] ?? null;
}

export type MonthRow = { month: string; event: string; n: number };
/** Monthly counts for the advertiser's ads (all QR tracking ids) and linked listings. */
export async function advertiserStats(
  a: Advertiser,
): Promise<{ ads: MonthRow[]; listings: MonthRow[]; sponsored: MonthRow[] }> {
  const sql = db()!;
  const [ads, listings, sponsored] = await Promise.all([
    sql.query(
      `select c.month, c.event, sum(c.count) n from ad_event_counts c join ads a on a.id = c.ad_id
       where a.advertiser_id = $1 group by c.month, c.event order by c.month desc`,
      [a.id],
    ),
    a.listing_ids.length
      ? sql.query(
          `select month, event, sum(n) n from listing_stats where listing_id = any($1) group by month, event order by month desc`,
          [a.listing_ids],
        )
      : Promise.resolve([]),
    sql
      .query(
        `select c.month, c.event, sum(c.count) n from sponsored_event_counts c
         join sponsored_placements p on p.id = c.placement_id
         where p.advertiser_id = $1 group by c.month, c.event order by c.month desc`,
        [a.id],
      )
      .catch(() => []),
  ]);
  const fix = (r: unknown[]) => (r as MonthRow[]).map((x) => ({ ...x, n: Number(x.n) }));
  return { ads: fix(ads), listings: fix(listings), sponsored: fix(sponsored) };
}
