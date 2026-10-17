import { NextResponse } from "next/server";
import { track } from "@/lib/analytics/track";
import { isPaid, listingById, mapUrl } from "@/lib/guide";

const VIA = { scan: "scan", tap: "tap", call: "call", map: "map", web: "website" } as const;
type Via = keyof typeof VIA;

/**
 * Counted link for paid tiers. QR codes use /go/<id> (a scan); ?via=tap (ad tap-to-open), ?via=call (Featured
 * Call / Book), ?via=map (directions) and ?via=web (website). Each hit adds 1 to that listing's monthly count
 * (no personal data), then redirects.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const l = listingById(id);
  // Counted links exist for paid tiers only (free listings have no QR).
  if (!l || !isPaid(l)) return new NextResponse("Not found", { status: 404 });
  const v = new URL(req.url).searchParams.get("via") ?? "scan";
  const via: Via = v in VIA ? (v as Via) : "scan";
  if (via === "call" && l.tier !== "featured") return new NextResponse("Not found", { status: 404 });
  if (via === "web" && !l.website) return new NextResponse("Not found", { status: 404 });
  await track(id, VIA[via], req.headers.get("user-agent"));
  if (via === "call") return NextResponse.redirect(`tel:${l.phone.replace(/[^\d+]/g, "")}`, 307);
  if (via === "map") return NextResponse.redirect(mapUrl(l), 307);
  if (via === "web") return NextResponse.redirect(l.website!, 307);
  const to = new URL(`/listing/${id}`, req.url);
  to.search = new URLSearchParams({
    utm_source: via === "scan" ? "own-qr" : "site",
    utm_medium: via === "scan" ? "qr" : via,
    utm_campaign: "lister",
    utm_content: id,
  }).toString();
  return NextResponse.redirect(to, 307);
}
