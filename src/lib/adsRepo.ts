import "server-only";
import { unstable_cache } from "next/cache";
import { adBySlug as jsonAd, adLandings, type AdLanding } from "@/lib/adLanding";
import type { EventName } from "@/lib/analytics/events";
import { db } from "@/lib/db";

type Row = {
  id: string;
  slug: string;
  tier: AdLanding["tier"];
  verified: "none" | "verified" | "verified_plus";
  is_demo: boolean;
  listing_id: string | null;
  features: AdLanding["features"];
  content: Omit<AdLanding, "slug" | "tier" | "verified" | "features" | "listingId" | "trackingId" | "demo">;
  tracking_id: string | null;
};
const toAd = (r: Row): AdLanding => ({
  ...r.content,
  slug: r.slug,
  tier: r.tier,
  demo: r.is_demo,
  verified: r.verified === "none" ? null : r.verified === "verified_plus" ? "verified-plus" : "verified",
  features: { saveContact: !!r.features?.saveContact, callButton: !!r.features?.callButton },
  listingId: r.listing_id,
  trackingId: r.tracking_id ?? "",
});
const SELECT = `select a.*, (select t.tracking_id from ad_tracking_ids t where t.ad_id = a.id and t.retired_at is null
  order by t.created_at limit 1) as tracking_id from ads a`;

/** Live ad by slug: Neon when DATABASE_URL is set, else content/ads.json. A DB error falls back to JSON. */
const cachedAd = unstable_cache(
  async (slug: string) => {
    const rows = (await db()!.query(`${SELECT} where a.slug = $1 and a.status = 'live'`, [slug])) as Row[];
    return rows[0] ? toAd(rows[0]) : null;
  },
  ["ad-by-slug"],
  { revalidate: 60, tags: ["ads"] },
);
export async function getAd(slug: string): Promise<AdLanding | undefined> {
  if (!db()) return jsonAd(slug);
  try {
    return (await cachedAd(slug)) ?? undefined;
  } catch (e) {
    console.warn("[ads] db read failed, using json", (e as Error).message);
    return jsonAd(slug);
  }
}
export async function listAds(): Promise<AdLanding[]> {
  const sql = db();
  if (!sql) return adLandings;
  return ((await sql.query(`${SELECT} order by a.slug`)) as Row[]).map(toAd);
}

/** Record one aggregated count for "ad:<slug>" or "ad:<slug>:<trackingId>". Returns false for unknown ids. */
export async function recordAdEvent(statId: string, event: EventName, month: string): Promise<boolean | null> {
  const sql = db();
  if (!sql) return null; // caller uses the generic store
  const [p, slug, t = "", extra] = statId.split(":");
  if (p !== "ad" || !slug || extra !== undefined) return false;
  const rows = (await sql.query(
    `insert into ad_event_counts (ad_id, tracking_id, event, month, count)
     select a.id, $2, $3, $4, 1 from ads a
      where a.slug = $1 and ($2 = '' or exists (select 1 from ad_tracking_ids t where t.ad_id = a.id and t.tracking_id = $2))
     on conflict (ad_id, tracking_id, event, month) do update set count = ad_event_counts.count + 1
     returning count`,
    [slug, t, event, month],
  )) as unknown[];
  return rows.length > 0;
}

export type AdStatRow = { slug: string; tracking_id: string; month: string; event: EventName; count: number };
export async function adStats(): Promise<AdStatRow[] | null> {
  const sql = db();
  if (!sql) return null;
  return (await sql.query(
    `select a.slug, c.tracking_id, c.month, c.event, c.count from ad_event_counts c join ads a on a.id = c.ad_id
     order by a.slug, c.month desc, c.tracking_id`,
  )) as AdStatRow[];
}
