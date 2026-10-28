import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdStatId } from "@/lib/adLanding";
import { track } from "@/lib/analytics/track";

/** Page-view beacon from listing pages (pages stay static). Body: { id, event }. Nothing personal stored. */
const Body = z.object({
  id: z.string().min(1).max(60),
  event: z.enum(["view", "scan", "call", "map", "website", "tap"]),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const p = Body.safeParse(body);
  if (!p.success) return new NextResponse(null, { status: 400 });
  // Listing pages send "view" only; QR ad pages (ad:<slug>) may also send scan and button clicks.
  if ((p.data.event !== "view" || p.data.id.split(":").length > 2) && !p.data.id.startsWith("ad:"))
    return new NextResponse(null, { status: 400 });
  if (p.data.id.startsWith("ad:") && !process.env.DATABASE_URL && !isAdStatId(p.data.id))
    return new NextResponse(null, { status: 400 });
  const ok = await track(p.data.id, p.data.event, req.headers.get("user-agent"));
  // Unknown ad / tracking id is a client error; listing misses stay 202 as before.
  return new NextResponse(null, { status: ok ? 204 : p.data.id.startsWith("ad:") ? 400 : 202 });
}
