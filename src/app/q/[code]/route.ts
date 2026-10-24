import { NextResponse } from "next/server";
import { resolveQr } from "@/lib/qrcodes";
import { listingEventParams } from "@/lib/seo";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";
const esc = (s: string) => JSON.stringify(s).replace(/</g, "\\u003c");

/**
 * QR landing: fires GA4 qr_scan, then redirects to the listing with utm_source=qr&utm_medium=<placement>&utm_campaign=founding.
 * Without a GA ID it is a plain 302 (UTMs still reach the listing page and the session ad context).
 */
export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const r = resolveQr(code);
  if (!r) return new NextResponse("Unknown QR code", { status: 404, headers: { "X-Robots-Tag": "noindex" } });
  const dest = new URL(r.target, req.url).toString();
  if (!GA_ID) return NextResponse.redirect(dest, 302);
  const ev = { ...listingEventParams(r.listing), placement: r.medium, campaign: "founding" };
  const html = `<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><meta name="robots" content="noindex">
<meta http-equiv="refresh" content="2;url=${dest.replace(/"/g, "&quot;")}"><title>Opening listing…</title>
<script async src="https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}
var d=${esc(dest)},done=false;function go(){if(!done){done=true;location.replace(d);}}
gtag('js',new Date());gtag('config',${esc(GA_ID)},{send_page_view:false});
gtag('event','qr_scan',Object.assign(${JSON.stringify(ev).replace(/</g, "\\u003c")},{event_callback:go}));
setTimeout(go,800);</script></head><body><p>Opening <a href="${dest.replace(/"/g, "&quot;")}">the listing</a>…</p></body></html>`;
  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" },
  });
}
