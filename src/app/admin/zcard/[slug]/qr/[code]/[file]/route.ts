import { isAdminReq } from "@/lib/adminSession";
import { zcardOwnsCode, getAdminZcard } from "@/lib/adminZcardDb";
import { zcardQrUrl } from "@/lib/adminZcard";
import { zcardQrPdf, zcardQrPng } from "@/lib/adminZcardQr";

export const dynamic = "force-dynamic";

const CODE = /^[a-z0-9]{4,12}$/;
const SLUG = /^[a-z0-9-]+$/;

/** Authenticated PNG or PDF of a ZCard tracking code. Does not create a new code. */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string; code: string; file: string }> }) {
  const { slug, code, file } = await params;
  if (!isAdminReq(req)) return new Response("Not found", { status: 404 });
  const kind = file === "qr.png" ? "png" : file === "qr.pdf" ? "pdf" : null;
  if (!kind || !SLUG.test(slug) || !CODE.test(code)) return new Response("Not found", { status: 404 });
  if (!(await zcardOwnsCode(slug, code))) return new Response("Not found", { status: 404 });
  const ad = await getAdminZcard(slug);
  if (!ad) return new Response("Not found", { status: 404 });
  const url = zcardQrUrl(slug, code);
  const headers = {
    "Cache-Control": "private, no-store",
    "X-Robots-Tag": "noindex",
  };
  if (kind === "png") {
    const png = await zcardQrPng(url);
    return new Response(new Uint8Array(png), {
      headers: {
        ...headers,
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="zcard-${slug}-${code}.png"`,
      },
    });
  }
  const pdf = await zcardQrPdf(url, ad.name, code);
  return new Response(Buffer.from(pdf), {
    headers: {
      ...headers,
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="zcard-${slug}-${code}.pdf"`,
    },
  });
}
