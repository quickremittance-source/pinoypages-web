import { abs, brand, isPaid, listings } from "@/lib/guide";
import { getCardListing } from "@/lib/cardListing";

export const revalidate = 3600;

export function generateStaticParams() {
  return listings.filter(isPaid).map((l) => ({ file: `${l.id}.vcf` }));
}

const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");

/** "Save contact" vCard 3.0 — paid tiers only. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const id = file.replace(/\.vcf$/, "");
  const found = file.endsWith(".vcf") ? await getCardListing(id) : undefined;
  const l = found?.l;
  if (!l || !found) return new Response("Not found", { status: 404 });
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(l.name)}`,
    `ORG:${esc(l.name)}`,
    `TEL;TYPE=WORK,VOICE:${l.phone}`,
    ...(l.email ? [`EMAIL;TYPE=WORK:${l.email}`] : []),
    `ADR;TYPE=WORK:;;;${esc(l.area)};ON;;Canada`,
    `URL:${abs(found.fullPath)}`,
    `NOTE:${esc(`Listed in ${brand.name}.${l.languages ? ` Languages: ${l.languages}` : ""}`)}`,
    "END:VCARD",
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${id}.vcf"` },
  });
}
