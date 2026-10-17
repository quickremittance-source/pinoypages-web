import { listings } from "@/lib/guide";
import { isPaid, qrPdf, qrPng, qrSvg } from "@/lib/qr";

export const dynamic = "force-static";
export const dynamicParams = false;
const FREE = ["basic.svg", "basic.png"];
const PAID = ["branded.svg", "branded.png", "branded.pdf"];

export function generateStaticParams() {
  return listings.flatMap((l) => [...FREE, ...(l.tier !== "free" ? PAID : [])].map((file) => ({ id: l.id, file })));
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string; file: string }> }) {
  const { id, file } = await params;
  const l = listings.find((x) => x.id === id);
  if (!l || (PAID.includes(file) && !isPaid(id)) || ![...FREE, ...PAID].includes(file))
    return new Response("Not found", { status: 404 });
  const branded = file.startsWith("branded");
  const headers = {
    "Cache-Control": "public, max-age=86400",
    "Content-Disposition": `inline; filename="${id}-${file}"`,
  };
  if (file.endsWith(".svg"))
    return new Response(await qrSvg(id, branded), { headers: { ...headers, "Content-Type": "image/svg+xml" } });
  if (file.endsWith(".png"))
    return new Response(new Uint8Array(await qrPng(id, branded)), {
      headers: { ...headers, "Content-Type": "image/png" },
    });
  return new Response(new Uint8Array(await qrPdf(id, l.name)), {
    headers: { ...headers, "Content-Type": "application/pdf" },
  });
}
