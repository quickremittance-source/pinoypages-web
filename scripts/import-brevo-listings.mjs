#!/usr/bin/env node
// Import Brevo business contacts as FREE, UNVERIFIED listings. Developer-only; read-only against Brevo.
// Writes content/brevo-listings.json (public business details only: never emails, never contact names) and,
// when DATABASE_URL is set, upserts the same rows into Neon `listings`. Idempotent and re-runnable.
// Skips: personal contacts (no business name), contacts already on the site (synced from the site, or same
// name/phone as an existing listing), duplicates inside Brevo, non-GTA or unknown area, and categories with no
// clear site category. Nothing is invented: missing fields stay blank.
// Usage: BREVO_API_KEY=... [DATABASE_URL=...] node scripts/import-brevo-listings.mjs [--report report.json]
import { readFileSync, writeFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const KEY = process.env.BREVO_API_KEY;
if (!KEY) throw new Error("BREVO_API_KEY not set");
const reportPath = process.argv.includes("--report") ? process.argv[process.argv.indexOf("--report") + 1] : null;

const GTA = new Set(
  "Toronto,North York,Scarborough,Etobicoke,East York,York,Mississauga,Brampton,Caledon,Markham,Vaughan,Richmond Hill,Aurora,Newmarket,King,Whitchurch-Stouffville,East Gwillimbury,Georgina,Oakville,Burlington,Milton,Halton Hills,Pickering,Ajax,Whitby,Oshawa,Clarington,Uxbridge,Scugog,Brock,Thornhill,Maple,Concord,Woodbridge,Unionville,Stouffville".split(
    ",",
  ),
);
const AREA_ALIAS = { "Downtown/Old Toronto": "Toronto" };
// Brevo category -> site category. Only where the Brevo label clearly matches (auto follows existing listings).
const CAT = {
  "restaurant/food": "food",
  "Food & Dining": "food",
  "catering/home-based food": "food",
  "bakery/desserts": "food",
  "grocery/retail": "groceries",
  "Groceries & Specialty Foods": "groceries",
  "health/caregiving": "health",
  "Health & Care": "health",
  "beauty/salon": "beauty",
  "Beauty & Wellness": "beauty",
  "immigration/legal": "immigration",
  "Immigration & Settlement": "immigration",
  "events/entertainment": "events",
  "Events & Celebrations": "events",
  "church/religious": "community",
  "community org/media": "community",
  "Community & Faith": "community",
  "Money & Business": "money-business",
  remittance: "money-business",
  "cargo/balikbayan": "money-business",
  "real estate": "money-business",
  "finance/insurance": "money-business",
  "accounting/tax": "money-business",
  "trades/home services": "home-trades",
  "Home & Trades": "home-trades",
  "auto/transport": "home-trades",
  "education/tutoring": "education",
  "Education & Kids": "education",
};

async function fetchAll() {
  const all = [];
  for (let o = 0; ; o += 1000) {
    const r = await fetch(`https://api.brevo.com/v3/contacts?limit=1000&offset=${o}`, {
      headers: { "api-key": KEY, accept: "application/json" },
    });
    if (!r.ok) throw new Error(`Brevo contacts HTTP ${r.status}`);
    const d = await r.json();
    all.push(...d.contacts);
    if (d.contacts.length < 1000) return all;
  }
}

const norm = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
const digits = (p) => {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 11 && d[0] === "1") d = d.slice(1);
  return d.length === 10 ? d : "";
};
const fmtPhone = (d) => (d ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : "");
const url = (u) => (/^https?:\/\/\S+$/i.test(String(u || "").trim()) ? String(u).trim() : "");
function parseAddress(a) {
  const parts = String(a || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let city = "";
  if (parts.length >= 2 && /^ON\b/i.test(parts[parts.length - 1])) {
    parts.pop();
    city = parts.pop() || "";
  }
  const street = parts.join(", ");
  return { city, street: /[a-z]/i.test(street) && !/^n\/?a$/i.test(street) ? street : "" };
}

const site = JSON.parse(readFileSync(new URL("../content/public-listings.json", import.meta.url)));
const siteNames = new Set(site.listings.map((l) => norm(l.name)));
const sitePhones = new Set(site.listings.map((l) => digits(l.phone)).filter(Boolean));

// Extra duplicate keys: website host and street address (catches "Harina Bakeshop – North York" vs "Harina Bakeshoppe").
const host = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};
const SHARED_HOSTS = /(^|\.)(facebook|instagram|linktr|google|yelp|wixsite|square|ubereats|doordash|skipthedishes)\./;
const siteHosts = new Set(site.listings.map((l) => host(l.website)).filter((h) => h && !SHARED_HOSTS.test(h + ".")));
const siteAddrs = new Set(site.listings.map((l) => norm(l.address)).filter((x) => x.length > 5));
const seenHost = new Set(),
  seenAddr = new Set();
const contacts = await fetchAll();
const skip = {
  personal: 0,
  alreadyOnSite: 0,
  duplicateInBrevo: 0,
  nonGta: 0,
  areaUnknown: 0,
  categoryUnmapped: 0,
  remittancePolicy: 0,
  noContactDetails: 0,
};
const unmappedCats = {},
  nonGtaAreas = {};
const seenKey = new Set(),
  seenEmail = new Set();
const out = [];
for (const c of contacts) {
  const a = c.attributes || {};
  const name = String(a.BUSINESS_NAME || "").trim();
  if (!name) {
    skip.personal++;
    continue;
  }
  const ph = digits(a.SMS);
  if (a.LISTING_SLUG || siteNames.has(norm(name)) || (ph && sitePhones.has(ph))) {
    skip.alreadyOnSite++;
    continue;
  }
  const email = String(c.email || "").toLowerCase();
  const key = norm(name) + "|" + ph;
  if (seenKey.has(key) || (email && seenEmail.has(email))) {
    skip.duplicateInBrevo++;
    continue;
  }
  seenKey.add(key);
  if (email) seenEmail.add(email);
  const { city, street } = parseAddress(a.ADDRESS);
  let area = AREA_ALIAS[a.AREA] || a.AREA || "";
  if (!area || area === "Unknown") area = city;
  if (!area || area === "Unknown") {
    skip.areaUnknown++;
    continue;
  }
  if (!GTA.has(area)) {
    skip.nonGta++;
    nonGtaAreas[area] = (nonGtaAreas[area] || 0) + 1;
    continue;
  }
  const category = CAT[a.CATEGORY];
  if (!category) {
    skip.categoryUnmapped++;
    unmappedCats[a.CATEGORY] = (unmappedCats[a.CATEGORY] || 0) + 1;
    continue;
  }
  const h = host(url(a.WEBSITE));
  const hk = h && !SHARED_HOSTS.test(h + ".") ? h : "";
  const ak = street ? norm(street) : "";
  if ((hk && siteHosts.has(hk)) || (ak.length > 5 && siteAddrs.has(ak))) {
    skip.alreadyOnSite++;
    continue;
  }
  if ((hk && seenHost.has(hk)) || (ak.length > 5 && seenAddr.has(ak))) {
    skip.duplicateInBrevo++;
    continue;
  }
  // Site policy: no remittance / padala listings in the public directory.
  if (/remit|padala|money transfer/i.test(`${name} ${a.CATEGORY} ${a.WEBSITE || ""}`)) {
    skip.remittancePolicy++;
    continue;
  }
  if (!ph && !url(a.WEBSITE) && !street) {
    skip.noContactDetails++;
    continue;
  }
  if (hk) seenHost.add(hk);
  if (ak) seenAddr.add(ak);
  const id =
    "brevo-" +
    String(a.EXT_ID || `c${c.id}`)
      .replace(/^prospect-/, "")
      .replace(/[^a-z0-9-]/gi, "-")
      .toLowerCase();
  const l = {
    listing_id: id,
    id,
    name,
    category,
    area,
    tier: "free",
    verified: false,
    source: url(a.SOURCE) || "brevo",
  };
  if (street) l.address = street;
  if (ph) l.phone = fmtPhone(ph);
  if (url(a.WEBSITE)) l.website = url(a.WEBSITE);
  out.push(l);
}
out.sort((x, y) => x.id.localeCompare(y.id));
writeFileSync(
  new URL("../content/brevo-listings.json", import.meta.url),
  JSON.stringify(
    {
      note: "Free, unverified listings imported from Brevo prospects (publicly sourced). Generated by scripts/import-brevo-listings.mjs; do not edit by hand.",
      listings: out,
    },
    null,
    2,
  ) + "\n",
);

let db = null;
if (process.env.DATABASE_URL) {
  const sql = neon(process.env.DATABASE_URL);
  const qs = out.map((l) =>
    sql.query(
      `insert into listings (listing_id, id, name, category, area, tier, verified, address, phone, website, source, data)
     values ($1,$2,$3,$4,$5,'free',false,$6,$7,$8,$9,$10)
     on conflict (listing_id) do update set id=excluded.id, name=excluded.name, category=excluded.category, area=excluded.area,
       tier='free', verified=false, address=excluded.address, phone=excluded.phone, website=excluded.website,
       source=excluded.source, data=excluded.data, updated_at=now()`,
      [
        l.listing_id,
        l.id,
        l.name,
        l.category,
        l.area,
        l.address ?? null,
        l.phone ?? null,
        l.website ?? null,
        l.source,
        JSON.stringify(l),
      ],
    ),
  );
  for (let i = 0; i < qs.length; i += 100) await sql.transaction(qs.slice(i, i + 100));
  // Remove Brevo-imported rows that no longer qualify (keeps the DB in step with content/brevo-listings.json).
  await sql.query("delete from listings where listing_id like 'brevo-%' and not (listing_id = any($1))", [
    out.map((l) => l.listing_id),
  ]);
  const [r] = await sql.query(
    "select count(*)::int n, count(*) filter (where verified)::int v from listings where listing_id like 'brevo-%'",
  );
  db = r;
}
const missing = {
  address: out.filter((l) => !l.address).length,
  phone: out.filter((l) => !l.phone).length,
  website: out.filter((l) => !l.website).length,
  noContact: out.filter((l) => !l.phone && !l.website && !l.address).length,
};
const report = {
  brevoContacts: contacts.length,
  imported: out.length,
  skipped: skip,
  nonGtaAreas,
  unmappedCats,
  missing,
  byCategory: Object.fromEntries(
    Object.entries(out.reduce((m, l) => ((m[l.category] = (m[l.category] || 0) + 1), m), {})),
  ),
  db,
};
if (reportPath) writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
