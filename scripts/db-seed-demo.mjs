// Seed only the DEMO ads from content/ads.json (idempotent). Usage: DATABASE_URL=... node scripts/db-seed-demo.mjs
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);
const { ads } = JSON.parse(await readFile("content/ads.json", "utf8"));
for (const a of ads.filter((x) => x.demo === true)) {
  const { slug, tier, verified, features, listingId, trackingId, ...content } = a;
  delete content.demo;
  const v = verified === "verified-plus" ? "verified_plus" : (verified ?? "none");
  const [row] = await sql.query(
    `insert into ads (slug, tier, verified, status, is_demo, listing_id, features, content)
     values ($1, $2, $3, 'live', true, $4, $5, $6)
     on conflict (slug) do update set tier = excluded.tier, verified = excluded.verified, features = excluded.features,
       content = excluded.content, listing_id = excluded.listing_id, updated_at = now()
     returning id`,
    [slug, tier, v, listingId, JSON.stringify(features), JSON.stringify(content)],
  );
  await sql.query(
    `insert into ad_tracking_ids (tracking_id, ad_id, placement) values ($1, $2, 'demo') on conflict (tracking_id) do nothing`,
    [trackingId, row.id],
  );
  console.log("seeded", slug);
}
