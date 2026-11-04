import { isAdminReq } from "@/lib/adminSession";
import { qrFile } from "@/lib/onboardingDb";

export const dynamic = "force-dynamic";

/** Print-ready QR (PNG 1200px or SVG) for a stored code. Admin only. */
export async function GET(req: Request, { params }: { params: Promise<{ code: string; file: string }> }) {
  const { code, file } = await params;
  if (!isAdminReq(req)) return new Response("Not found", { status: 404 });
  const kind = file === "qr.svg" ? "svg" : file === "qr.png" ? "png" : null;
  if (!kind || !/^[a-z0-9][a-z0-9_-]{0,79}$/.test(code)) return new Response("Not found", { status: 404 });
  const out = await qrFile(code, kind).catch(() => null);
  if (!out) return new Response("Not found", { status: 404 });
  const headers = { "Content-Disposition": `attachment; filename="${code}.${kind}"`, "Cache-Control": "private, no-store", "X-Robots-Tag": "noindex" };
  return typeof out === "string"
    ? new Response(out, { headers: { ...headers, "Content-Type": "image/svg+xml" } })
    : new Response(new Uint8Array(out), { headers: { ...headers, "Content-Type": "image/png" } });
}
