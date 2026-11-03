import "server-only";
import { db } from "@/lib/db";

/**
 * Inquiry store. Neon `inquiries` is the source of truth; each row is mirrored to a private Google Sheet through a
 * Google Apps Script web app (SHEETS_WEBHOOK_URL + SHEETS_WEBHOOK_SECRET). The script also emails an internal
 * notification to the owner inbox. Nothing is ever sent to the submitter.
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
