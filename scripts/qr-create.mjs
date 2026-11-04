#!/usr/bin/env node
// Create an additional QR code for a listing. Many codes per listing are allowed (qr_codes.code is the key,
// listing_id is not unique); each printed code is counted separately in qr_scan_daily by code.
// Usage:
//   DATABASE_URL=... node scripts/qr-create.mjs --listing <listing_id> --label "magazine p.12" \
//     --target https://pinoypages.ca/go/<id> [--advertiser <uuid>] [--code <code>] [--dry-run]
// Target is locked to https://(www.)pinoypages.ca/go/<x> or /card/<x> (also enforced in Neon by migration 007).
// Production writes need ALLOW_PROD_WRITE=yes. Prints only the code and its printable URL.
import { neon } from "@neondatabase/serverless";

const arg = (k) => (process.argv.includes(k) ? process.argv[process.argv.indexOf(k) + 1] : undefined);
const listing = arg("--listing");
const label = (arg("--label") ?? "").trim();
const target = arg("--target") ?? "";
const advertiser = arg("--advertiser") ?? null;
const DRY = process.argv.includes("--dry-run");
export const TARGET = /^https:\/\/(www\.)?pinoypages\.ca\/(go|card)\/[A-Za-z0-9_-]{1,80}$/;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

if (!listing || !label) throw new Error("--listing and --label are required");
if (!TARGET.test(target)) throw new Error("--target must be https://pinoypages.ca/go/<id> or /card/<id>");
const code = arg("--code") ?? `${slug(label)}-${slug(listing)}`.slice(0, 80);
if (!/^[a-z0-9][a-z0-9_-]{0,79}$/.test(code)) throw new Error("bad code");
if (DRY) {
  console.log(JSON.stringify({ code, listing, placement: label, target, url: `https://pinoypages.ca/qr/${code}` }));
  process.exit(0);
}
if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
if (process.env.VERCEL_ENV === "production" && process.env.ALLOW_PROD_WRITE !== "yes")
  throw new Error("Refusing to write production without ALLOW_PROD_WRITE=yes");
const sql = neon(process.env.DATABASE_URL);
const r = await sql.query(
  `insert into qr_codes (code, listing_id, advertiser_id, placement, target_url) values ($1,$2,$3,$4,$5)
   on conflict (code) do nothing returning code`,
  [code, listing, advertiser, label, target],
);
if (!r.length) throw new Error(`code ${code} already exists; pass --code to choose another`);
console.log(`created ${code} -> print https://pinoypages.ca/qr/${code}`);
