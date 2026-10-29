// Seed only the DEMO ads from content/ads.json (idempotent). Usage: DATABASE_URL=... node scripts/db-seed-demo.mjs
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
if (process.env.VERCEL_ENV === "production") throw new Error("Demo ads are never seeded into production");
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

// Demo advertisers (one per demo ad), clearly labelled; never in production. Idempotent by business_name + is_demo.
const PLAN = { full: "verified_plus", half: "verified", quarter: "ads_only", zcard: "ads_only" };
for (const a of ads.filter((x) => x.demo === true)) {
  const name = `DEMO advertiser – ${a.slug}`;
  let [adv] = await sql.query(`select id from advertisers where business_name = $1 and is_demo`, [name]);
  if (!adv)
    [adv] = await sql.query(
      `insert into advertisers (business_name, tier, ad_sizes, status, is_demo, notes)
       values ($1, $2, $3, 'active', true, 'Demo record for testing; not a real business') returning id`,
      [name, PLAN[a.tier], [a.tier]],
    );
  await sql.query(`update ads set advertiser_id = $1 where slug = $2 and is_demo`, [adv.id, a.slug]);
  console.log("demo advertiser", name);
}
