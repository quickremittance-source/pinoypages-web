import { NextResponse } from "next/server";
import { z } from "zod";
import { track } from "@/lib/analytics/track";

/** Page-view beacon from listing pages (pages stay static). Body: { id, event: "view" }. Nothing personal stored. */
const Body = z.object({ id: z.string().min(1).max(60), event: z.literal("view") });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const p = Body.safeParse(body);
  if (!p.success) return new NextResponse(null, { status: 400 });
  const ok = await track(p.data.id, p.data.event, req.headers.get("user-agent"));
  return new NextResponse(null, { status: ok ? 204 : 202 });
}
