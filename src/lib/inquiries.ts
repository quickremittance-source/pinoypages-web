import "server-only";
import { db } from "@/lib/db";

/**
 * Inquiry store. Neon `inquiries` is the source of truth. Each new row triggers ONE internal notification email via
 * Brevo transactional API (BREVO_API_KEY) to the owner inbox only, reply-to = submitter. Nothing is ever sent to the
 * submitter. Optional, off unless both env vars are set: mirror to a Google Sheet Apps Script (SHEETS_WEBHOOK_*).
 */
export type Inquiry = {
  kind: string;
  email: string;
  name?: string;
  business?: string;
  phone?: string;
  listing?: string;
  product?: string;
  source?: string;
  data: Record<string, unknown>;
};

export async function saveInquiry(q: Inquiry): Promise<number | null> {
  const sql = db();
  let id: number | null = null;
  if (sql) {
    try {
      const rows = (await sql.query(
        `insert into inquiries (kind, name, business, email, phone, listing_id, product, source, payload)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb) returning id`,
        [
          q.kind,
          q.name ?? null,
          q.business ?? null,
          q.email,
          q.phone || null,
          q.listing || null,
          q.product || null,
          q.source ?? null,
          JSON.stringify(q.data),
        ],
      )) as { id: number }[];
      id = Number(rows[0]?.id ?? null);
    } catch (e) {
      console.error("[inquiries] db insert failed", (e as Error).message);
    }
  }
  await notifyOwner(id, q);
  const ok = await mirrorToSheet(id, q);
  if (ok && sql && id) {
    try {
      await sql.query("update inquiries set sheet_synced = true where id = $1", [id]);
    } catch {}
  }
  return id;
}

async function mirrorToSheet(id: number | null, q: Inquiry): Promise<boolean> {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;
  if (!url || !secret) return false;
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, id, submittedAt: new Date().toISOString(), ...q }),
      signal: AbortSignal.timeout(5000),
      redirect: "follow",
    });
    return r.ok;
  } catch (e) {
    console.error("[inquiries] sheet mirror failed", (e as Error).message);
    return false;
  }
}

const NOTIFY_TO = "pinoypagesca@gmail.com";
const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Internal notice to the owner only. Returns true when Brevo accepted it. Never throws. */
export async function notifyOwner(id: number | null, q: Inquiry): Promise<boolean> {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    console.warn("[inquiries] BREVO_API_KEY not set; notification skipped");
    return false;
  }
  const rows = Object.entries({ name: q.name, business: q.business, email: q.email, phone: q.phone, ...q.data })
    .filter(([k, v]) => v && !["consent", "website_url"].includes(k))
    .map(([k, v]) => `<tr><td><b>${esc(k)}</b></td><td>${esc(v)}</td></tr>`)
    .join("");
  const validReply = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(q.email);
  try {
    const r = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Pinoy Pages website", email: process.env.INQUIRY_SENDER_EMAIL || NOTIFY_TO },
        to: [{ email: NOTIFY_TO }],
        ...(validReply ? { replyTo: { email: q.email, name: q.name || q.email } } : {}),
        subject: `New ${q.kind}${id ? ` #${id}` : ""}: ${q.business || q.name || q.email}`.slice(0, 180),
        htmlContent: `<p>New website ${esc(q.kind)}${id ? ` (Neon inquiries #${id})` : ""}.</p><table>${rows}</table>`,
        tags: ["inquiry", q.kind],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!r.ok) console.error("[inquiries] Brevo notify failed", r.status);
    return r.ok;
  } catch (e) {
    console.error("[inquiries] Brevo notify error", (e as Error).message);
    return false;
  }
}
