import "server-only";
import { db } from "@/lib/db";
import { adBySlug, adLandings, type AdLanding } from "@/lib/adLanding";
import { windowOf, fill, daysIn, type RangeDays } from "@/lib/dashRange";
import {
  ANALYTICS_NOTE,
  groupByCodeDay,
  makeTrackingId,
  zcardQrUrl,
  type CodeSeries,
  type DailyPoint,
  type LandingPatch,
} from "@/lib/adminZcard";

type Row = Record<string, unknown>;
const N = (v: unknown) => Number(v ?? 0) || 0;
const need = () => {
  const sql = db();
  if (!sql) throw new Error("No database connected in this environment");
  return sql;
};

export type AdminZcard = AdLanding & { id?: string; status: string };

function fromJson(a: AdLanding): AdminZcard {
  return { ...a, status: "live" };
}

function fromRow(r: Row): AdminZcard {
  const content = (r.content ?? {}) as Record<string, unknown>;
  const verified = r.verified === "verified_plus" ? "verified-plus" : r.verified === "verified" ? "verified" : null;
  const features = (r.features ?? {}) as { saveContact?: boolean; callButton?: boolean };
  return {
    slug: String(r.slug),
    tier: "zcard",
    demo: r.is_demo === true || r.is_demo === "true",
    name: String(content.name ?? r.name ?? r.slug),
    tagline: String(content.tagline ?? ""),
    offer: String(content.offer ?? ""),
    services: Array.isArray(content.services) ? content.services.map(String) : [],
    photos: N(content.photos),
    phone: String(content.phone ?? ""),
    whatsapp: content.whatsapp == null || content.whatsapp === "" ? null : String(content.whatsapp),
    website: content.website == null || content.website === "" ? null : String(content.website),
    mapQuery: String(content.mapQuery ?? ""),
    listingId: r.listing_id == null || r.listing_id === "" ? null : String(r.listing_id),
    trackingId: String(r.tracking_id ?? ""),
    verified,
    features: { saveContact: !!features.saveContact, callButton: !!features.callButton },
    id: r.id == null ? undefined : String(r.id),
    status: String(r.status ?? "draft"),
  };
}

export type ZcardIndexRow = {
  slug: string;
  name: string;
  listingId: string | null;
  status: string;
  demo: boolean;
  qrCount: number | null;
  scans: number | null;
};

export async function listAdminZcards(): Promise<ZcardIndexRow[]> {
  const sql = db();
  if (!sql) {
    return adLandings
      .filter((a) => a.tier === "zcard")
      .map((a) => ({
        slug: a.slug,
        name: a.name,
        listingId: a.listingId,
        status: "live",
        demo: a.demo,
        qrCount: a.trackingId ? 1 : 0,
        scans: null,
      }));
  }
  const rows = (await sql.query(
    `select a.slug, a.content->>'name' as name, a.listing_id, a.status, a.is_demo,
            (select count(*)::int from ad_tracking_ids t where t.ad_id = a.id and t.retired_at is null) as qr_count,
            coalesce((select sum(c.count) from ad_event_counts c where c.ad_id = a.id and c.event = 'scan'), 0) as scans
       from ads a
      where a.tier = 'zcard' and a.archived_at is null
      order by a.slug`,
  )) as Row[];
  return rows.map((r) => ({
    slug: String(r.slug),
    name: String(r.name ?? r.slug),
    listingId: r.listing_id == null ? null : String(r.listing_id),
    status: String(r.status),
    demo: r.is_demo === true || r.is_demo === "true",
    qrCount: N(r.qr_count),
    scans: N(r.scans),
  }));
}

export async function getAdminZcard(slug: string): Promise<AdminZcard | null> {
  const sql = db();
  if (!sql) {
    const a = adBySlug(slug);
    return a?.tier === "zcard" ? fromJson(a) : null;
  }
  const rows = (await sql.query(
    `select a.id::text id, a.slug, a.tier, a.status, a.is_demo, a.listing_id, a.features, a.content, a.verified,
            (select t.tracking_id from ad_tracking_ids t where t.ad_id = a.id and t.retired_at is null
              order by t.created_at limit 1) as tracking_id
       from ads a where a.slug = $1 and a.tier = 'zcard'`,
    [slug],
  )) as Row[];
  return rows[0] ? fromRow(rows[0]) : null;
}

export type ZcardCode = { code: string; label: string; url: string };

export async function listZcardCodes(slug: string): Promise<ZcardCode[]> {
  const ad = await getAdminZcard(slug);
  if (!ad) return [];
  const fallback: ZcardCode[] = ad.trackingId
    ? [{ code: ad.trackingId, label: "Printed QR", url: zcardQrUrl(slug, ad.trackingId) }]
    : [];
  const sql = db();
  if (!sql) return fallback;
  const rows = (await sql.query(
    `select t.tracking_id as code, coalesce(nullif(t.placement, ''), 'Printed QR') as label
       from ad_tracking_ids t join ads a on a.id = t.ad_id
      where a.slug = $1 and a.tier = 'zcard' and t.retired_at is null
      order by t.created_at, t.tracking_id`,
    [slug],
  )) as { code: string; label: string }[];
  if (!rows.length) return fallback;
  return rows.map((r) => ({ code: r.code, label: r.label, url: zcardQrUrl(slug, r.code) }));
}

export async function zcardOwnsCode(slug: string, code: string): Promise<boolean> {
  const ad = await getAdminZcard(slug);
  if (!ad) return false;
  if (ad.trackingId === code) return true;
  const sql = db();
  if (!sql) return false;
  const rows = (await sql.query(
    `select 1 from ad_tracking_ids t join ads a on a.id = t.ad_id
      where a.slug = $1 and a.tier = 'zcard' and t.tracking_id = $2 and t.retired_at is null`,
    [slug, code],
  )) as unknown[];
  return rows.length > 0;
}

export async function createZcardCode(slug: string, label: string): Promise<string> {
  const sql = need();
  const ads = (await sql.query(
    `select id::text id from ads where slug = $1 and tier = 'zcard' and archived_at is null`,
    [slug],
  )) as { id: string }[];
  if (!ads[0]) throw new Error("ZCard not found");
  const taken = (
    (await sql.query(`select tracking_id from ad_tracking_ids where ad_id = $1`, [ads[0].id])) as {
      tracking_id: string;
    }[]
  ).map((r) => r.tracking_id);
  const code = makeTrackingId(label, taken);
  const rows = (await sql.query(
    `with ins as (
       insert into ad_tracking_ids (tracking_id, ad_id, placement) values ($1, $2::uuid, $3)
       on conflict (tracking_id) do nothing returning tracking_id, placement
     )
     insert into admin_audit (entity, ref, action, after)
     select 'ad', $4, 'qr-create', jsonb_build_object('tracking_id', tracking_id, 'placement', placement) from ins
     returning (select tracking_id from ins)`,
    [code, ads[0].id, label, slug],
  )) as { tracking_id?: string }[];
  if (!rows.length) throw new Error(`code ${code} already exists; try a different label`);
  return code;
}

async function auditedZcard(slug: string, action: string, setSql: string, where: string, params: unknown[]) {
  const rows = (await need().query(
    `with b as (select to_jsonb(t) j from ads t where slug = $1 ${where}),
          u as (update ads set ${setSql} where slug = $1 ${where} returning to_jsonb(ads) j)
     insert into admin_audit (entity, ref, action, before, after)
     select 'ad', $1, $${params.length + 2}, (select j from b), j from u returning id`,
    [slug, ...params, action],
  )) as Row[];
  return rows.length > 0;
}

export function updateZcardLanding(slug: string, p: LandingPatch) {
  return auditedZcard(
    slug,
    "edit-landing",
    `content = content || jsonb_build_object(
       'name', $2::text, 'tagline', $3::text, 'offer', $4::text, 'services', $5::jsonb,
       'phone', $6::text, 'whatsapp', $7::text, 'website', $8::text, 'mapQuery', $9::text
     ), updated_at = now()`,
    "and archived_at is null and tier = 'zcard'",
    [p.name, p.tagline, p.offer, JSON.stringify(p.services), p.phone, p.whatsapp, p.website, p.mapQuery],
  );
}

export async function linkZcardListing(slug: string, listingId: string) {
  const found = (await need().query(`select listing_id from listings where listing_id = $1 and status <> 'archived'`, [
    listingId,
  ])) as { listing_id: string }[];
  if (!found[0]) throw new Error("listing not found");
  return auditedZcard(
    slug,
    "link-listing",
    `listing_id = $2, updated_at = now()`,
    "and archived_at is null and tier = 'zcard'",
    [listingId],
  );
}

export function unlinkZcardListing(slug: string) {
  return auditedZcard(
    slug,
    "unlink-listing",
    `listing_id = null, updated_at = now()`,
    "and archived_at is null and tier = 'zcard' and listing_id is not null",
    [],
  );
}

export type ZcardAnalytics = {
  from: string;
  to: string;
  noDb: boolean;
  note: string;
  byDay: { event: string; series: DailyPoint[] }[];
  byCodeMonth: { code: string; month: string; count: number }[];
  listingByCode: CodeSeries[];
};

export async function getZcardAnalytics(slug: string, days: RangeDays): Promise<ZcardAnalytics | null> {
  const { from, to } = windowOf(days);
  const empty = (noDb: boolean): ZcardAnalytics => ({
    from,
    to,
    noDb,
    note: ANALYTICS_NOTE,
    byDay: [],
    byCodeMonth: [],
    listingByCode: [],
  });
  const sql = db();
  if (!sql) return empty(true);
  const ads = (await sql.query(`select id::text id, listing_id from ads where slug = $1 and tier = 'zcard'`, [
    slug,
  ])) as {
    id: string;
    listing_id: string | null;
  }[];
  if (!ads[0]) return null;
  const [counts, daily, listing] = await Promise.all([
    sql.query(
      `select tracking_id as code, month, count from ad_event_counts where ad_id = $1 and event = 'scan' order by month desc, tracking_id`,
      [ads[0].id],
    ) as Promise<Row[]>,
    sql.query(
      `select to_char(day,'YYYY-MM-DD') as day, event, sum(n) n from ad_event_daily
        where ad_ref = $1 and day between $2 and $3 group by 1, 2`,
      [ads[0].id, from, to],
    ) as Promise<Row[]>,
    ads[0].listing_id
      ? (sql.query(
          `select c.code, coalesce(nullif(c.placement, ''), c.code) as label, to_char(s.day,'YYYY-MM-DD') as day, sum(s.n) n
             from qr_codes c
             left join qr_scan_daily s on s.code = c.code and s.day between $2 and $3
            where c.listing_id = $1
            group by c.code, c.placement, s.day`,
          [ads[0].listing_id, from, to],
        ) as Promise<Row[]>)
      : Promise.resolve([]),
  ]);
  const all = daysIn(from, to);
  const events = ["impression", "scan", "click"] as const;
  return {
    from,
    to,
    noDb: false,
    note: ANALYTICS_NOTE,
    byDay: events.map((event) => ({
      event,
      series: fill(
        all,
        daily.filter((r) => r.event === event).map((r) => ({ day: String(r.day), n: N(r.n) })),
      ),
    })),
    byCodeMonth: counts.map((r) => ({ code: String(r.code || "(none)"), month: String(r.month), count: N(r.count) })),
    listingByCode: groupByCodeDay(
      listing
        .filter((r) => r.day)
        .map((r) => ({ code: String(r.code), label: String(r.label), day: String(r.day), n: N(r.n) })),
      from,
      to,
    ),
  };
}
