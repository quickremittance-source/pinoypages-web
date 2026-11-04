import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { qrTarget } from "@/lib/dashRange";
import { dayKey } from "@/lib/siteAnalytics";

export const dynamic = "force-dynamic";
const CODE = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
const device = (ua: string) => (/ipad|tablet/i.test(ua) ? "tablet" : /mobi|android|iphone/i.test(ua) ? "mobile" : ua ? "desktop" : "unknown");

/**
 * Printed QR codes resolve here: /qr/<code>. Looks up an active qr_codes row, adds 1 to qr_scan_daily
 * (code, Toronto day, device type; no IP, no UA stored) and redirects to its pinoypages.ca /go or /card target.
 * Unknown/inactive codes or disallowed targets: 404.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sql = db();
  if (!sql || !CODE.test(id)) return new NextResponse("Not found", { status: 404 });
  const rows = (await sql.query(`select target_url from qr_codes where code = $1 and active`, [id]).catch(() => [])) as { target_url: string }[];
  const t = rows[0] && qrTarget(rows[0].target_url);
  if (!t || !t.follow) return new NextResponse("Not found", { status: 404 });
  await sql
    .query(
      `insert into qr_scan_daily (code, day, device, n) values ($1, $2, $3, 1)
       on conflict (code, day, device) do update set n = qr_scan_daily.n + 1`,
      [id, dayKey(new Date()), device(req.headers.get("user-agent") ?? "")],
    )
    .catch(() => undefined);
  return NextResponse.redirect(new URL(t.path, req.nextUrl.origin), 302);
}
