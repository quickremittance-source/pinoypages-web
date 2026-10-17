import { NextResponse } from "next/server";
import { track } from "@/lib/analytics/track";
import { eventById } from "@/lib/guide";

/** Counted registration link for featured events (QR + Register button). Free events have no link. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = eventById(id);
  if (!e || e.tier !== "featured" || !e.link) return new NextResponse("Not found", { status: 404 });
  await track(id, "website", req.headers.get("user-agent"));
  return NextResponse.redirect(e.link, 307);
}
