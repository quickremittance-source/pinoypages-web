import QRCode from "qrcode";
import { adLandings, adQrUrl, hasQr } from "@/lib/adLanding";
import { getAd } from "@/lib/adsRepo";

export const dynamic = "force-static";
export const dynamicParams = true;
export const revalidate = 3600;
/** Print QR for every ad tier: /ad/qr/<slug>.svg and /ad/qr/<slug>.png → https://pinoypages.ca/ad/<slug>?src=qr&t=<trackingId> */
export function generateStaticParams() {
  return adLandings.filter(hasQr).flatMap((a) => [{ file: `${a.slug}.svg` }, { file: `${a.slug}.png` }]);
}
const opts = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#000000", light: "#FFFFFF" } };

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const m = /^([a-z0-9-]+)\.(svg|png)$/.exec(file);
  const a = m ? await getAd(m[1]!) : undefined;
  if (!m || !a || !a.trackingId || !hasQr(a)) return new Response("Not found", { status: 404 });
  const disp = `attachment; filename="pinoypages-ad-${a.slug}-qr.${m[2]}"`;
  if (m[2] === "svg") {
    const svg = await QRCode.toString(adQrUrl(a), { ...opts, type: "svg" });
    return new Response(svg, { headers: { "Content-Type": "image/svg+xml", "Content-Disposition": disp } });
  }
  const png = await QRCode.toBuffer(adQrUrl(a), { ...opts, type: "png", scale: 16 });
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png", "Content-Disposition": disp } });
}
