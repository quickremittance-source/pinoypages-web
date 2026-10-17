import { isFeatured, isPaid, listings } from "@/lib/guide";
import { counterPdf, qrPdf, qrPng, qrSvg } from "@/lib/qr";

export const dynamic = "force-static";
export const dynamicParams = false;
const FILES = ["qr.svg", "qr.png", "qr.pdf"];
const COUNTER = "counter.pdf"; // Verified Plus and up
const filesFor = (l: (typeof listings)[number]) => (isFeatured(l) ? [...FILES, COUNTER] : FILES);

/** QR files exist for paid tiers only (Verified and up); counter card for Verified Plus and up. Free has no QR. */
export function generateStaticParams() {
  return listings.filter(isPaid).flatMap((l) => filesFor(l).map((file) => ({ id: l.id, file })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l || !isPaid(l) || !filesFor(l).includes(file)) return new Response("Not found", { status: 404 });
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
  if (file === COUNTER)
    return new Response(new Uint8Array(await counterPdf(id)), {
      headers: { ...headers, "Content-Type": "application/pdf" },
    });
  return new Response(new Uint8Array(await qrPdf(id, l.name)), {
    headers: { ...headers, "Content-Type": "application/pdf" },
  });
}
