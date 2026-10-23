#!/usr/bin/env node
/**
 * Export QR codes (PNG + SVG) for every public business × print placement.
 *   node scripts/export-qr.mjs [--out qr-out] [--base https://pinoypages-web.vercel.app] [--only <slug>]
 * Each code encodes <base>/q/<abbr>-<slug>; that route fires qr_scan and redirects with UTMs.
 * Output is NOT committed (qr-out/ is gitignored).
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import QRCode from "qrcode";

const arg = (k, d) => {
  const i = process.argv.indexOf(k);
  return i > -1 ? process.argv[i + 1] : d;
};
const out = arg("--out", "qr-out");
const base = arg("--base", process.env.NEXT_PUBLIC_SITE_URL || "https://pinoypages-web.vercel.app").replace(/\/$/, "");
const only = arg("--only");
const PLACEMENTS = { ws: "window-sticker", cc: "counter-card", fl: "flyer", eb: "event-booth" };

const data = JSON.parse(readFileSync(new URL("../content/public-listings.json", import.meta.url)));
let n = 0;
for (const l of data.listings) {
  const slug = l.id.replace(/^pub-/, "");
  if (only && slug !== only) continue;
  const dir = path.join(out, slug);
  mkdirSync(dir, { recursive: true });
  for (const [abbr, name] of Object.entries(PLACEMENTS)) {
    const url = `${base}/q/${abbr}-${slug}`;
    const opts = { errorCorrectionLevel: "Q", margin: 4, color: { dark: "#000000", light: "#FFFFFF" } };
    await QRCode.toFile(path.join(dir, `${slug}_${name}.png`), url, { ...opts, width: 1200 });
    writeFileSync(path.join(dir, `${slug}_${name}.svg`), await QRCode.toString(url, { ...opts, type: "svg" }));
    n++;
  }
}
console.log(`Wrote ${n} QR codes (PNG+SVG) to ${out}/ for base ${base}`);
