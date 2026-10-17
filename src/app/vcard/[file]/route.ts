import { abs, brand, isPaid, listings } from "@/lib/guide";

export const dynamic = "force-static";
export const dynamicParams = false;

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
  const l = listings.find((x) => x.id === id);
  if (!l || !isPaid(l) || !file.endsWith(".vcf")) return new Response("Not found", { status: 404 });
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(l.name)}`,
    `ORG:${esc(l.name)}`,
    `TEL;TYPE=WORK,VOICE:${l.phone}`,
    ...(l.email ? [`EMAIL;TYPE=WORK:${l.email}`] : []),
    `ADR;TYPE=WORK:;;;${esc(l.area)};ON;;Canada`,
    `URL:${abs(`/listing/${l.id}`)}`,
    `NOTE:${esc(`Listed in ${brand.name}. Languages: ${l.languages}`)}`,
    "END:VCARD",
  ];
  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${id}.vcf"` },
  });
}
