import { abs } from "@/lib/guide";
import { adLandings } from "@/lib/adLanding";

export const dynamic = "force-static";
export const dynamicParams = false;
export function generateStaticParams() {
  return adLandings.filter((a) => a.tier === "card").map((a) => ({ file: `${a.slug}.vcf` }));
}
const esc = (s: string) =>
  s
    .replace(/\\/g, "\\\\")
    .replace(/([,;])/g, "\\$1")
    .replace(/\n/g, "\\n");

/** "Save contact" vCard 3.0 for business-card tier ad pages. */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const { file } = await params;
  const a = adLandings.find((x) => `${x.slug}.vcf` === file && x.tier === "card");
  if (!a) return new Response("Not found", { status: 404 });
  const body = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `FN:${esc(a.name)}`,
    `ORG:${esc(a.name)}`,
    `TEL;TYPE=WORK,VOICE:${a.phone}`,
    `ADR;TYPE=WORK:;;;${esc(a.mapQuery)};;;Canada`,
    `URL:${abs(`/ad/${a.slug}`)}`,
    "END:VCARD",
    "",
  ].join("\r\n");
  return new Response(body, {
    headers: { "Content-Type": "text/vcard; charset=utf-8", "Content-Disposition": `attachment; filename="${file}"` },
  });
}
