import { NextResponse } from "next/server";
import { isBot } from "@/lib/analytics/events";
import { cleanPath, deviceOf, recordPageView, refHost } from "@/lib/siteAnalytics";

/** First-party page-view beacon. Body: { p: pathname, r: document.referrer }. Stores day, path, referrer host, device class only. */
export async function POST(req: Request) {
  const ua = req.headers.get("user-agent");
  let body: { p?: unknown; r?: unknown };
  try {
    body = JSON.parse(await req.text());
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  const path = cleanPath(body?.p);
  if (!path) return new NextResponse(null, { status: 400 });
  if (isBot(ua) || req.headers.get("sec-gpc") === "1" || req.headers.get("dnt") === "1")
    return new NextResponse(null, { status: 204 });
  try {
    await recordPageView(path, refHost(body?.r, req.headers.get("host")), deviceOf(ua!));
  } catch (e) {
    console.warn("[pv] write failed", (e as Error).message);
  }
  return new NextResponse(null, { status: 204 });
}
