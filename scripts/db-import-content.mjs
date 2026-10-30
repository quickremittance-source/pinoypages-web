// Import site content files into Neon and verify counts match exactly. Idempotent: upserts, and removes rows no
// longer in the files. Sample/demo/fictional rows (sample: true) are never imported.
// Usage: DATABASE_URL=... node scripts/db-import-content.mjs
import { neon } from "@neondatabase/serverless";
import { readFile } from "node:fs/promises";

if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL not set");
const sql = neon(process.env.DATABASE_URL);
const read = async (f) => JSON.parse(await readFile(f, "utf8"));
const pub = await read("content/public-listings.json");
const guide = await read("content/guide.json");
const brevo = await read("content/brevo-listings.json");
const real = (x) => x && x.sample !== true && x.demo !== true;

const cats = pub.categories.filter(real);
const listings = [...pub.listings, ...brevo.listings, ...guide.listings].filter(real);
const events = guide.events.filter(real);

const q = [];
for (const c of cats)
  q.push(
    sql.query(
      `insert into listing_categories (slug, name, icon, section) values ($1,$2,$3,$4)
       on conflict (slug) do update set name=excluded.name, icon=excluded.icon, section=excluded.section, updated_at=now()`,
      [c.slug, c.name, c.icon ?? null, c.section ?? null],
    ),
  );
for (const l of listings)
  q.push(
    sql.query(
      `insert into listings (listing_id, id, name, category, area, tier, verified, verified_until, dish_tags, address, phone,
         website, email, messenger, source, data)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16)
       on conflict (listing_id) do update set id=excluded.id, name=excluded.name, category=excluded.category,
         area=excluded.area, tier=excluded.tier, verified=excluded.verified, verified_until=excluded.verified_until,
         dish_tags=excluded.dish_tags, address=excluded.address, phone=excluded.phone, website=excluded.website,
         email=excluded.email, messenger=excluded.messenger, source=excluded.source, data=excluded.data, updated_at=now()`,
      [
        l.listing_id ?? l.id,
        l.id,
        l.name,
        l.category ?? null,
        l.area ?? null,
        l.tier ?? "free",
        l.verified === true,
        l.verifiedUntil ?? l.verified_until ?? null,
        l.dishTags ?? l.dish_tags ?? [],
        l.address ?? null,
        l.phone ?? null,
        l.website ?? null,
        l.email ?? null,
        l.messenger ?? null,
        l.source ?? null,
        JSON.stringify(l),
      ],
    ),
  );
for (const e of events)
  q.push(
    sql.query(
      `insert into events (id, kind, tier, name, date, category, data) values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (id) do update set kind=excluded.kind, tier=excluded.tier, name=excluded.name, date=excluded.date,
         category=excluded.category, data=excluded.data, updated_at=now()`,
      [e.id, e.kind ?? null, e.tier ?? null, e.name, e.date || e.start || null, e.category ?? null, JSON.stringify(e)],
    ),
  );
q.push(sql.query(`delete from listing_categories where not (slug = any($1))`, [cats.map((c) => c.slug)]));
q.push(sql.query(`delete from listings where not (listing_id = any($1))`, [listings.map((l) => l.listing_id ?? l.id)]));
q.push(sql.query(`delete from events where not (id = any($1))`, [events.map((e) => e.id)]));
await sql.transaction(q);

const [c] = await sql.query(
  `select (select count(*) from listing_categories)::int cats, (select count(*) from listings)::int listings,
          (select count(*) from events)::int events, (select count(*) from listings where verified)::int verified`,
);
const want = {
  cats: cats.length,
  listings: listings.length,
  events: events.length,
  verified: listings.filter((l) => l.verified === true).length,
};
const ok = Object.keys(want).every((k) => c[k] === want[k]);
console.log(JSON.stringify({ db: c, files: want, match: ok, skippedSamples: guide.events.length - events.length }));
if (!ok) process.exit(1);
