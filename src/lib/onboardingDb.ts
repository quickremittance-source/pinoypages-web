import "server-only";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import { planFor, qrCodeFor, qrTargetFor, STATUS_FOR, verifiedUntil, type Decision } from "@/lib/onboarding";
import { dayKey } from "@/lib/siteAnalytics";

export type QueueRow = { id: number; kind: string; name: string | null; business: string | null; phone: string | null; listing_id: string | null; product: string | null; status: string; created_ref: string | null; created_at: string; payload: Record<string, unknown> };

export async function queue(status: string): Promise<QueueRow[] | null> {
  const sql = db();
  if (!sql) return null;
  return (await sql.query(
    `select id, kind, name, business, phone, listing_id, product, status, created_ref, to_char(created_at at time zone 'America/Toronto','YYYY-MM-DD HH24:MI') as created_at, payload
       from inquiries where ($1 = 'all' or status = $1) order by id desc limit 200`,
    [status],
  )) as QueueRow[];
}

/** Approve/reject/spam. Approve creates or updates the Neon listing or a draft ad row, No QR is auto-created: QR codes are advertiser-only (Nov 4 2026). Never writes Brevo. */
export async function decide(id: number, d: Decision): Promise<string> {
  const sql = db();
  if (!sql) throw new Error("no database");
  const [i] = (await sql.query(`select * from inquiries where id = $1`, [id])) as QueueRow[];
  if (!i) throw new Error("not found");
  let ref: string | null = null;
  if (d === "approve") {
    const p = planFor({ ...i, id: Number(i.id) });
    if (p.type === "none") throw new Error(p.reason);
    if (p.type === "listing") {
      await sql.query(
        `insert into listings (listing_id, id, name, category, area, phone, tier, verified, source, status, onboarded_inquiry)
         values ($1, $1, $2, $3, $4, $5, $6, false, 'onboarding', 'published', $7)
         on conflict (listing_id) do update set
           name = coalesce(nullif(excluded.name, ''), listings.name), phone = coalesce(excluded.phone, listings.phone),
           tier = excluded.tier, onboarded_inquiry = excluded.onboarded_inquiry, updated_at = now()`,
        [p.listing_id, p.name, p.category, p.area, p.phone, p.tier, id],
      );
      ref = `listing:${p.listing_id}`;
    } else {
      await sql.query(
        `insert into ads (slug, tier, status, content) values ($1, $2, 'draft', $3::jsonb) on conflict (slug) do nothing`,
        [p.slug, p.tier, JSON.stringify({ name: p.name, phone: p.phone ?? "", tagline: "", offer: "", services: [] })],
      );
      ref = `ad:${p.slug}`;
    }
  }
  await sql.query(`update inquiries set status = $2, decided_at = now(), created_ref = coalesce($3, created_ref) where id = $1`, [id, STATUS_FOR[d], ref]);
  return ref ?? STATUS_FOR[d];
}

export async function addQr(listingId: string, label: string) {
  const sql = db();
  if (!sql) throw new Error("no database");
  const code = qrCodeFor(label, listingId);
  await sql.query(
    `insert into qr_codes (code, listing_id, placement, target_url) values ($1, $2, $3, $4) on conflict (code) do nothing`,
    [code, listingId, label, qrTargetFor(listingId)],
  );
  return code;
}

/** Live video check passed: Verified for one quarterly issue. */
export async function markVerified(listingId: string) {
  const sql = db();
  if (!sql) throw new Error("no database");
  const until = verifiedUntil(dayKey());
  await sql.query(
    `update listings set tier = 'verified', verified = true, verified_until = $2, video_check_at = now(), updated_at = now() where listing_id = $1`,
    [listingId, until],
  );
  return until;
}

export async function welcome(listingId: string) {
  const sql = db();
  if (!sql) return null;
  const [[l], codes, adv] = (await Promise.all([
    sql.query(`select listing_id, name, tier, verified, to_char(verified_until,'YYYY-MM-DD') as verified_until, video_check_at from listings where listing_id = $1`, [listingId]),
    sql.query(`select code, placement from qr_codes where listing_id = $1 order by created_at`, [listingId]),
    sql.query(`select v.stats_token from advertisers v join advertiser_listings al on al.advertiser_id = v.id where al.listing_id = $1 limit 1`, [listingId]),
  ])) as [Record<string, unknown>[], { code: string; placement: string }[], { stats_token: string }[]];
  return l ? { listing: l, codes, statsToken: adv[0]?.stats_token ?? null } : null;
}

/** Print-ready QR for a stored code: encodes https://pinoypages.ca/qr/<code> (counted, then redirected). */
export async function qrFile(code: string, kind: "png" | "svg") {
  const sql = db();
  if (!sql) return null;
  const [r] = (await sql.query(`select code from qr_codes where code = $1`, [code])) as { code: string }[];
  if (!r) return null;
  const url = `https://pinoypages.ca/qr/${r.code}`;
  const o = { errorCorrectionLevel: "Q" as const, margin: 4, color: { dark: "#002050", light: "#FFFFFF" } };
  return kind === "svg" ? await QRCode.toString(url, { ...o, type: "svg" }) : await QRCode.toBuffer(url, { ...o, type: "png", width: 1200 });
}
