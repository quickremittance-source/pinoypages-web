#!/usr/bin/env node
// Compress site images: max 1600px wide, WebP, <= 300 KB each.
// Usage: node scripts/optimize-images.mjs [--check] [dir=public]
// Icons (favicon/app icons) stay PNG because browsers and OS launchers expect PNG.
// Photo credits live in data files, not in image metadata, so they are unaffected.
import { readdir, stat, readFile, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const MAX_BYTES = 300 * 1024;
export const MAX_WIDTH = 1600;
const args = process.argv.slice(2);
const check = args.includes("--check");
const root = args.find((a) => !a.startsWith("--")) ?? "public";
const KEEP_PNG = /(favicon|icon-\d+|apple-touch-icon)\.png$/i;
const IMG = /\.(jpe?g|png|webp|avif|gif)$/i;

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else if (IMG.test(e.name)) out.push(p);
  }
  return out;
}

const files = await walk(root);
let before = 0,
  after = 0,
  failed = [];
for (const f of files) {
  const size = (await stat(f)).size;
  before += size;
  if (check) {
    const { width = 0 } = await sharp(f).metadata();
    if (size > MAX_BYTES || width > MAX_WIDTH) failed.push(`${f} (${Math.round(size / 1024)} KB, ${width}px)`);
    after += size;
    continue;
  }
  const input = await readFile(f);
  const base = sharp(input).resize({ width: MAX_WIDTH, withoutEnlargement: true });
  let buf, outPath;
  if (KEEP_PNG.test(f) || /\.gif$/i.test(f)) {
    outPath = f;
    buf = /\.gif$/i.test(f) ? input : await base.png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer();
    if (buf.length >= size) buf = input;
  } else {
    outPath = f.replace(IMG, ".webp");
    for (const q of [82, 75, 68, 60, 50, 40]) {
      buf = await base.clone().webp({ quality: q, effort: 6 }).toBuffer();
      if (buf.length <= MAX_BYTES) break;
    }
    if (outPath === f && buf.length >= size) buf = input;
  }
  await writeFile(outPath, buf);
  if (outPath !== f) await unlink(f);
  after += buf.length;
  console.log(`${f} -> ${outPath}: ${Math.round(size / 1024)} KB -> ${Math.round(buf.length / 1024)} KB`);
}
console.log(`Total: ${Math.round(before / 1024)} KB -> ${Math.round(after / 1024)} KB (${files.length} files)`);
if (check && failed.length) {
  console.error(
    `Images over ${MAX_BYTES / 1024} KB or ${MAX_WIDTH}px:\n  ${failed.join("\n  ")}\nRun: npm run images:optimize`,
  );
  process.exit(1);
}
