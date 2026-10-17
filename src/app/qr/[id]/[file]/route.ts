import { isPaid, listings } from "@/lib/guide";
import { qrPdf, qrPng, qrSvg } from "@/lib/qr";

export const dynamic = "force-static";
export const dynamicParams = false;
const FILES = ["qr.svg", "qr.png", "qr.pdf"];

/** Branded QR files exist for paid tiers only (Starter and up). Free listings have no QR. */
export function generateStaticParams() {
  return listings.filter(isPaid).flatMap((l) => FILES.map((file) => ({ id: l.id, file })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l || !isPaid(l) || !FILES.includes(file)) return new Response("Not found", { status: 404 });
  const headers = {
    "Cache-Control": "public, max-age=86400",
    "Content-Disposition": `inline; filename="${id}-${file}"`,
  };
  if (file.endsWith(".svg"))
    return new Response(await qrSvg(id, true), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  if (file.endsWith(".png"))
    return new Response(new Uint8Array(await qrPng(id, true)), {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  return new Response(new Uint8Array(await qrPdf(id, l.name)), {
    headers: { ...headers, "Content-Type": "application/pdf" },
  });
}
