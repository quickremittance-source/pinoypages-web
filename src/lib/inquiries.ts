import "server-only";
import { db } from "@/lib/db";
import { NOTIFY_TO, SENDER, notifyEnabled } from "@/lib/inquiryNotice";

/**
 * Inquiry store. Neon `inquiries` is the source of truth; claims are worked from pinoypagesca@gmail.com only.
 * ONE optional notification path, OFF by default: only when INQUIRY_NOTIFY_ENABLED === "true" (and BREVO_API_KEY is
 * set) is an internal notice sent via Brevo, from PinoyPages <info@pinoypages.ca>, to pinoypagesca@gmail.com only,
 * reply-to = submitter. Nothing is ever sent to the submitter. No Google Sheet mirror.
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
  return id;
}


const esc = (v: unknown) =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** Internal notice to the owner only. Returns true when Brevo accepted it. Never throws. */
export async function notifyOwner(id: number | null, q: Inquiry): Promise<boolean> {
  if (!notifyEnabled()) return false;
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
        sender: SENDER,
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
