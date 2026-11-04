import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { windowOf, type RangeDays } from "@/lib/dashRange";
import type { AdPatch, ListingPatch, MetricRow } from "@/lib/adminEdit";

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0) || 0;
const need = () => {
  const sql = db();
  if (!sql) throw new Error("No database connected in this environment");
  return sql;
};

/* ---------- listings ---------- */
export type AdminListing = Row & { listing_id: string; id: string; name: string; status: string; locked: boolean };
export async function searchListings(q: string, status: string): Promise<AdminListing[] | null> {
  const sql = db();
  if (!sql) return null;
  const p: unknown[] = [];
  const w: string[] = [];
  if (q)
    w.push(
      `(name ilike $${p.push(`%${q}%`)} or id ilike $${p.length} or coalesce(area,'') ilike $${p.length} or coalesce(category,'') ilike $${p.length})`,
    );
  if (status === "archived") w.push("status = 'archived'");
  else if (status) w.push(`status = $${p.push(status)}`);
  else w.push("status <> 'archived'");
  return (await sql.query(
    `select listing_id, id, name, category, area, tier, verified, status, locked, brevo_contact_id is not null as from_brevo
       from listings where ${w.join(" and ")} order by name limit 200`,
    p,
  )) as AdminListing[];
}
export async function getListing(listingId: string): Promise<Row | null> {
  const [r] = (await need().query(
    `select listing_id, id, name, category, area, tier, verified, to_char(verified_until,'YYYY-MM-DD') verified_until, address, phone,
            website, email, status, locked, archived_at, brevo_contact_id is not null as from_brevo from listings where listing_id = $1`,
    [listingId],
  )) as Row[];
  return r ?? null;
}
export async function listingAudit(entity: "listing" | "ad", ref: string) {
  const sql = db();
  if (!sql) return [];
  return (await sql.query(
    `select id, to_char(at at time zone 'America/Toronto','YYYY-MM-DD HH24:MI') at, actor, action, before, after
       from admin_audit where entity = $1 and ref = $2 order by at desc limit 50`,
    [entity, ref],
  )) as Row[];
}

/** Run one update + its audit row in a single statement (before/after snapshots). Returns false if nothing matched. */
async function audited(
  entity: "listing" | "ad",
  ref: string,
  action: string,
  table: string,
  keyCol: string,
  setSql: string,
  where: string,
  params: unknown[],
) {
  const rows = (await need().query(
    `with b as (select to_jsonb(t) j from ${table} t where ${keyCol} = $1 ${where}),
          u as (update ${table} set ${setSql} where ${keyCol} = $1 ${where} returning to_jsonb(${table}) j)
     insert into admin_audit (entity, ref, action, before, after)
     select $${params.length + 2}, $1, $${params.length + 3}, (select j from b), j from u returning id`,
    [ref, ...params, entity, action],
  )) as Row[];
  return rows.length > 0;
}

export function updateListing(listingId: string, p: ListingPatch) {
  return audited(
    "listing",
    listingId,
    "edit",
    "listings",
    "listing_id",
    `name=$2, category=$3, area=$4, phone=$5, email=$6, address=$7, website=$8, tier=$9, verified=$10,
     verified_until=$11::date, status=$12, locked=$13, updated_at=now()`,
    "and status <> 'archived'",
    [
      p.name,
      p.category,
      p.area,
      p.phone,
      p.email,
      p.address,
      p.website,
      p.tier,
      p.verified,
      p.verified_until,
      p.status,
      p.locked,
    ],
  );
}
export const LISTING_OPS = {
  hide: ["status='hidden', locked=true, updated_at=now()", "and status = 'published'"],
  unhide: ["status='published', locked=true, updated_at=now()", "and status = 'hidden'"],
  archive: ["status='archived', archived_at=now(), locked=true, updated_at=now()", "and status <> 'archived'"],
  restore: ["status='hidden', archived_at=null, updated_at=now()", "and status = 'archived'"],
} as const;
export type ListingOp = keyof typeof LISTING_OPS;
export const listingOp = (listingId: string, op: ListingOp) =>
  audited("listing", listingId, op, "listings", "listing_id", LISTING_OPS[op][0], LISTING_OPS[op][1], []);
/** Hard delete: only rows already archived. Audit keeps the full before snapshot. */
export async function deleteListing(listingId: string) {
  const rows = (await need().query(
    `with d as (delete from listings where listing_id = $1 and status = 'archived' returning to_jsonb(listings) j)
     insert into admin_audit (entity, ref, action, before, after) select 'listing', $1, 'delete', j, null from d returning id`,
    [listingId],
  )) as Row[];
  return rows.length > 0;
}

/* ---------- ads ---------- */
export async function searchAds(q: string, show: string): Promise<Row[] | null> {
  const sql = db();
  if (!sql) return null;
  const p: unknown[] = [];
  const w = [show === "archived" ? "archived_at is not null" : "archived_at is null"];
  if (q) w.push(`(slug ilike $${p.push(`%${q}%`)} or content->>'name' ilike $${p.length})`);
  return (await sql.query(
    `select id::text id, slug, tier, status, is_demo, listing_id, content->>'name' as name, to_char(start_date,'YYYY-MM-DD') start_date,
            to_char(end_date,'YYYY-MM-DD') end_date, archived_at from ads where ${w.join(" and ")} order by slug limit 200`,
    p,
  )) as Row[];
}
export async function getAd(slug: string): Promise<Row | null> {
  const [r] = (await need().query(
    `select id::text id, slug, tier, status, is_demo, listing_id, content->>'name' as name, to_char(start_date,'YYYY-MM-DD') start_date,
            to_char(end_date,'YYYY-MM-DD') end_date, archived_at from ads where slug = $1`,
    [slug],
  )) as Row[];
  return r ?? null;
}
export const updateAd = (slug: string, p: AdPatch) =>
  audited(
    "ad",
    slug,
    "edit",
    "ads",
    "slug",
    `listing_id=$2, tier=$3, status=$4, start_date=$5::date, end_date=$6::date, content=jsonb_set(content,'{name}',to_jsonb($7::text)), updated_at=now()`,
    "and archived_at is null",
    [p.listing_id, p.tier, p.status, p.start_date, p.end_date, p.name],
  );
export const AD_OPS = {
  hide: ["status='draft', updated_at=now()", "and archived_at is null and status = 'live'"],
  unhide: ["status='live', updated_at=now()", "and archived_at is null and status <> 'live'"],
  archive: ["status='ended', archived_at=now(), updated_at=now()", "and archived_at is null"],
  restore: ["archived_at=null, updated_at=now()", "and archived_at is not null"],
} as const;
export type AdOp = keyof typeof AD_OPS;
export const adOp = (slug: string, op: AdOp) =>
  audited("ad", slug, op, "ads", "slug", AD_OPS[op][0], AD_OPS[op][1], []);
export async function deleteAd(slug: string) {
  const rows = (await need().query(
    `with d as (delete from ads where slug = $1 and archived_at is not null returning to_jsonb(ads) j)
     insert into admin_audit (entity, ref, action, before, after) select 'ad', $1, 'delete', j, null from d returning id`,
    [slug],
  )) as Row[];
  return rows.length > 0;
}

/* ---------- hub metrics (one round of 6 grouped queries, cached 5 min, tag "dash") ---------- */
async function loadHub(days: RangeDays): Promise<{ from: string; to: string; rows: MetricRow[] } | null> {
  const sql = db();
  if (!sql) return null;
  const { from, to } = windowOf(days);
  const r = [from, to];
  const [ls, ads, zc, le, ae, qr] = (await Promise.all([
    sql.query(`select listing_id, name, status from listings where status <> 'archived'`),
    sql.query(`select id::text id, slug, content->>'name' as name, status from ads where archived_at is null`),
    sql.query(`select id, title, status from zcards`),
    sql.query(
      `select listing_id, event, sum(n) n from listing_event_daily where day between $1 and $2 group by 1,2`,
      r,
    ),
    sql.query(`select ad_ref, event, sum(n) n from ad_event_daily where day between $1 and $2 group by 1,2`, r),
    sql.query(
      `select c.code, c.listing_id, coalesce(sum(s.n),0) n from qr_codes c
         left join qr_scan_daily s on s.code = c.code and s.day between $1 and $2 group by c.code, c.listing_id`,
      r,
    ),
  ])) as [Row[], Row[], Row[], Row[], Row[], Row[]];
  const lev = new Map<string, Record<string, number>>();
  for (const e of le) {
    const o = lev.get(String(e.listing_id)) ?? {};
    o[String(e.event)] = N(e.n);
    lev.set(String(e.listing_id), o);
  }
  const aev = new Map<string, Record<string, number>>();
  for (const e of ae) {
    const o = aev.get(String(e.ad_ref)) ?? {};
    o[String(e.event)] = N(e.n);
    aev.set(String(e.ad_ref), o);
  }
  const codes = new Map<string, { code: string; n: number }[]>();
  for (const c of qr)
    if (c.listing_id)
      codes.set(String(c.listing_id), [
        ...(codes.get(String(c.listing_id)) ?? []),
        { code: String(c.code), n: N(c.n) },
      ]);
  const rows: MetricRow[] = [
    ...ls.map((l) => {
      const e = lev.get(String(l.listing_id)) ?? {};
      const cs = codes.get(String(l.listing_id)) ?? [];
      return {
        kind: "listing" as const,
        ref: String(l.listing_id),
        name: String(l.name),
        status: String(l.status),
        views: N(e.view),
        clicks: N(e.tap) + N(e.share),
        contacts: N(e.call) + N(e.map) + N(e.website),
        scans: cs.reduce((s, c) => s + c.n, 0),
        codes: cs.sort((a, b) => b.n - a.n),
      };
    }),
    ...[
      ...ads.map((a) => ({
        key: String(a.id),
        ref: String(a.slug),
        name: String(a.name ?? a.slug),
        status: String(a.status),
      })),
      ...zc.map((z) => ({ key: String(z.id), ref: `zcard:${z.id}`, name: String(z.title), status: String(z.status) })),
    ].map((a) => {
      const e = aev.get(a.key) ?? {};
      return {
        kind: "ad" as const,
        ref: a.ref,
        name: a.name,
        status: a.status,
        views: N(e.impression),
        clicks: N(e.click),
        contacts: 0,
        scans: N(e.scan),
        codes: [],
      };
    }),
  ];
  return { from, to, rows };
}
export const getHub = (days: RangeDays) =>
  unstable_cache(() => loadHub(days), ["admin-hub-v1", String(days)], { revalidate: 300, tags: ["dash"] })();
