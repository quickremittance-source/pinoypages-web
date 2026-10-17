import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { listings } from "@/lib/guide";

/** Short link printed in each lister's own QR code. Counts the scan, then redirects with UTM tags. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!listings.some((l) => l.id === id)) return new NextResponse("Not found", { status: 404 });
  const scan = { kind: "qr-scan", id, at: new Date().toISOString(), ref: req.headers.get("referer") ?? "" };
  console.info("[qr-scan]", JSON.stringify(scan));
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), "data");
      await mkdir(dir, { recursive: true });
      await appendFile(path.join(dir, "scans.jsonl"), JSON.stringify(scan) + "\n");
    } catch {
      /* logging only */
    }
  }
  const to = new URL(`/listing/${id}`, req.url);
  to.search = new URLSearchParams({
    utm_source: "own-qr",
    utm_medium: "qr",
    utm_campaign: "lister",
    utm_content: id,
  }).toString();
  return NextResponse.redirect(to, 307);
}
