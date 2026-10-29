import "server-only";
import { db } from "@/lib/db";
import { monthKey } from "@/lib/analytics/events";

/** Max Sponsored results shown per search (query or category). Raise SPONSORED_SLOTS to expand. */
export function sponsoredSlots(): number {
  const n = Number(process.env.SPONSORED_SLOTS);
  return Number.isInteger(n) && n >= 0 ? n : 2;
}
export const SPONSORED_PRICE = "Rates on request";
const IS_PROD = process.env.VERCEL_ENV === "production";

export type Sponsored = { id: string; title: string; href: string; blurb: string | null; is_demo: boolean };

/** Active, in-date placements whose keywords match a query word or whose categories match the filter. */
export async function sponsoredFor(q: string, category = ""): Promise<Sponsored[]> {
  const sql = db();
  const slots = sponsoredSlots();
  const words = q.toLowerCase().split(/\s+/).filter(Boolean).slice(0, 10);
  if (!sql || slots === 0 || (!words.length && !category)) return [];
  try {
    return (await sql.query(
      `select id, title, href, blurb, is_demo from sponsored_placements
       where active and (start_date is null or start_date <= current_date) and (end_date is null or end_date >= current_date)
         and ($4::boolean = false or not is_demo)
         and (keywords && $1::text[] or ($2 <> '' and $2 = any(categories)))
       order by random() limit $3`,
      [words, category, slots, IS_PROD],
    )) as Sponsored[];
  } catch (e) {
    console.warn("[sponsored] read failed", (e as Error).message);
    return [];
  }
}

export async function recordSponsored(id: string, event: "impression" | "click"): Promise<string | null> {
  const sql = db();
  if (!sql || !/^[0-9a-f-]{36}$/.test(id)) return null;
  try {
    const rows = (await sql.query(
      `with p as (select id, href from sponsored_placements where id = $1)
       , up as (insert into sponsored_event_counts (placement_id, month, event, count)
         select id, $2, $3, 1 from p on conflict (placement_id, month, event)
         do update set count = sponsored_event_counts.count + 1)
       select href from p`,
      [id, monthKey(), event],
    )) as { href: string }[];
    return rows[0]?.href ?? null;
  } catch (e) {
    console.warn("[sponsored] write failed", (e as Error).message);
    return null;
  }
}

export type Placement = Sponsored & {
  advertiser_id: string;
  keywords: string[];
  categories: string[];
  start_date: string | null;
  end_date: string | null;
  active: boolean;
};
export async function listPlacements(advertiserId?: string): Promise<Placement[] | null> {
  const sql = db();
  if (!sql) return null;
  return (await sql.query(
    `select id, advertiser_id, title, href, blurb, keywords, categories, active, is_demo,
       to_char(start_date,'YYYY-MM-DD') start_date, to_char(end_date,'YYYY-MM-DD') end_date
     from sponsored_placements where ($1::uuid is null or advertiser_id = $1) order by created_at`,
    [advertiserId ?? null],
  )) as Placement[];
}
