import { NextResponse, type NextRequest } from "next/server";
import { isBot } from "@/lib/analytics/events";
import { recordSponsored } from "@/lib/sponsored";

/** Sponsored result click: count it, then redirect to the placement's own (site-relative) target. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const href = isBot(req.headers.get("user-agent")) ? null : await recordSponsored(id, "click");
  return NextResponse.redirect(new URL(href && href.startsWith("/") ? href : "/search", req.url), 302);
}
