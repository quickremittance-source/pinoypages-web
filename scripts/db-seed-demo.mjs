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

// Demo Sponsored search placement (preview only; labelled DEMO, hidden in production).
{
  const [adv] = await sql.query(
    `select id from advertisers where business_name = 'DEMO advertiser – demo-card' and is_demo`,
  );
  if (adv) {
    const [has] = await sql.query(`select 1 from sponsored_placements where advertiser_id = $1 and is_demo`, [adv.id]);
    if (!has)
      await sql.query(
        `insert into sponsored_placements (advertiser_id, title, href, blurb, keywords, categories, is_demo)
         values ($1, 'DEMO Sponsored result', '/zcard/demo-card', 'Sample Sponsored placement for testing.', $2, '{}', true)`,
        [adv.id, ["demo", "sponsored"]],
      );
    console.log("demo sponsored placement");
  }
}
