#!/usr/bin/env node
// Sync website listings into Brevo as contacts in "Pinoy Pages — Website Listings".
// Idempotent: contacts are keyed by EXT_ID = listing id. Sends nothing; never touches other lists.
// CASL: listings are publicly sourced, no consent -> CONSENT_STATUS="none - publicly sourced", OPT_IN=false.
// LISTING_STATUS: 1 = "Prospect listed", 2 = "Verified listed" (blank = neither).
// Usage: BREVO_API_KEY=... node scripts/sync-brevo.mjs [--dry-run]
// Only real listings (content/public-listings.json). The sample listings in content/guide.json are fictional and are never synced.
import { readFileSync } from "node:fs";

const DRY = process.argv.includes("--dry-run");
const KEY = process.env.BREVO_API_KEY;
if (!KEY && !DRY) {
  console.error("BREVO_API_KEY not set");
  process.exit(1);
}
const LIST_NAME = "Pinoy Pages — Website Listings";
const CONSENT = "none - publicly sourced";
const API = "https://api.brevo.com/v3";
const CONTACT_PAGE = 100;
const WRITE_CONCURRENCY = 5;
const MAX_RETRIES = 6;

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function api(method, path, body) {
  let attempt = 0;
  for (;;) {
    const r = await fetch(API + path, {
      method,
      headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const t = await r.text();
    let data = null;
    if (t) {
      try {
        data = JSON.parse(t);
      } catch {
        data = { raw: t };
      }
    }
    if (r.status === 429 && attempt < MAX_RETRIES) {
      const ra = Number(r.headers.get("retry-after"));
      const wait = Number.isFinite(ra) && ra > 0 ? ra * 1000 : Math.min(30_000, 500 * 2 ** attempt);
      attempt++;
      await sleep(wait);
      continue;
    }
    return { ok: r.ok, status: r.status, data };
  }
}

async function mapPool(items, concurrency, fn) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) || 1 }, () => worker()));
  return out;
}

const data = JSON.parse(readFileSync(new URL("../content/public-listings.json", import.meta.url)));
const catName = Object.fromEntries((data.categories || []).map((c) => [c.slug, c.name]));

function e164(p) {
  if (!p) return null;
  let d = String(p).replace(/\D/g, "");
  if (d.length === 11 && d.startsWith("1")) d = d.slice(1);
  if (d.length !== 10 || /^[01]/.test(d)) return null;
  return "+1" + d;
}

const ATTRS = ["CATEGORY", "AREA", "TIER", "LISTING_SOURCE", "LISTING_SLUG", "WEBSITE", "ADDRESS", "CONSENT_STATUS"]; // text
const BOOL_ATTRS = ["VERIFIED"];

async function ensureAttributes() {
  let d = null;
  for (let i = 0; i < 3; i++) {
    const r = await api("GET", "/contacts/attributes");
    if (r.ok && r.data?.attributes) {
      d = r.data;
      break;
    }
    await sleep(500 * 2 ** i);
  }
  // If Brevo's attributes endpoint is down, do not attempt mass-create (attrs already exist in practice).
  if (!d?.attributes) {
    console.error("warn: could not list contact attributes; skipping ensureAttributes");
    return [];
  }
  const have = new Set(d.attributes.map((a) => a.name));
  const created = [];
  for (const [n, type] of [
    ["BUSINESS_NAME", "text"],
    ...ATTRS.map((a) => [a, "text"]),
    ...BOOL_ATTRS.map((a) => [a, "boolean"]),
  ]) {
    if (have.has(n)) continue;
    if (!DRY) {
      const r = await api("POST", `/contacts/attributes/normal/${n}`, { type });
      if (!r.ok) throw new Error(`attr ${n}: ${JSON.stringify(r.data)}`);
    }
    created.push(n);
  }
  // LISTING_STATUS: category attribute. 1 = "Prospect listed", 2 = "Verified listed", blank = not on the site.
  if (!have.has("LISTING_STATUS")) {
    if (!DRY) {
      const r = await api("POST", "/contacts/attributes/category/LISTING_STATUS", {
        type: "category",
        enumeration: [
          { value: 1, label: "Prospect listed" },
          { value: 2, label: "Verified listed" },
        ],
      });
      if (!r.ok) throw new Error(`attr LISTING_STATUS: ${JSON.stringify(r.data)}`);
    }
    created.push("LISTING_STATUS");
  }
  return created;
}

async function ensureList() {
  let offset = 0;
  for (;;) {
    const { data: d, ok } = await api("GET", `/contacts/lists?limit=50&offset=${offset}`);
    if (!ok) throw new Error(`lists: ${JSON.stringify(d)}`);
    const lists = d?.lists || [];
    const found = lists.find((l) => l.name === LIST_NAME);
    if (found) return found.id;
    if (lists.length < 50) {
      if (DRY) return "(new)";
      const folderId = lists[0]?.folderId ?? 1;
      const r = await api("POST", "/contacts/lists", { name: LIST_NAME, folderId });
      if (!r.ok) throw new Error(JSON.stringify(r.data));
      return r.data.id;
    }
    offset += 50;
  }
}

/** Paginate until exhausted so catalogues above 1,000 contacts stay complete. */
async function fetchAllContacts() {
  const all = [];
  let offset = 0;
  for (;;) {
    const r = await api("GET", `/contacts?limit=${CONTACT_PAGE}&offset=${offset}`);
    if (!r.ok) throw new Error(`contacts page offset=${offset}: ${JSON.stringify(r.data)}`);
    const batch = r.data?.contacts || [];
    all.push(...batch);
    if (batch.length < CONTACT_PAGE) break;
    offset += CONTACT_PAGE;
  }
  return all;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const out = { created: [], updated: [], skipped: [], matchedExisting: [], errors: [] };

const attrsCreated = DRY && !KEY ? [] : await ensureAttributes();
const listId = DRY && !KEY ? "(new)" : await ensureList();

let existing = [];
if (KEY) existing = await fetchAllContacts();

const byName = new Map(
  existing
    .filter((c) => c.attributes?.BUSINESS_NAME && c.email && !c.attributes?.LISTING_SLUG)
    .map((c) => [norm(c.attributes.BUSINESS_NAME), c]),
);
const usedSms = new Map();

const jobs = [];
for (const l of data.listings) {
  const attributes = {
    BUSINESS_NAME: l.name,
    CATEGORY: catName[l.category] || l.category,
    AREA: l.area || "",
    TIER: l.tier === "verified" ? "Verified" : "Free",
    VERIFIED: !!l.verified,
    LISTING_STATUS: l.verified ? 2 : 1, // 2 = "Verified listed", 1 = "Prospect listed"
    LISTING_SOURCE: l.source || "",
    LISTING_SLUG: l.id,
    WEBSITE: l.website || "",
    ADDRESS: l.address || "",
    CONSENT_STATUS: CONSENT,
    OPT_IN: false,
    EXT_ID: l.id,
  };
  const match = byName.get(norm(l.name));
  if (match) {
    out.matchedExisting.push(`${l.name} -> ${match.email}`);
    jobs.push({ kind: "match", l, match, attributes });
    continue;
  }
  const email = l.email || null;
  const sms = e164(l.phone);
  if (!email && !sms) {
    out.skipped.push(`${l.name} (no email/valid phone)`);
    continue;
  }
  if (!email && usedSms.has(sms)) {
    out.skipped.push(`${l.name} (phone shared with ${usedSms.get(sms)})`);
    continue;
  }
  if (sms) {
    usedSms.set(sms, l.name);
    attributes.SMS = sms;
  }
  jobs.push({ kind: "upsert", l, email, attributes });
}

if (DRY) {
  for (const job of jobs) {
    if (job.kind === "match") continue;
    out.created.push(`${job.l.name} [${job.email || job.attributes.SMS}]`);
  }
} else {
  await mapPool(jobs, WRITE_CONCURRENCY, async (job) => {
    if (job.kind === "match") {
      const safe = { ...job.attributes };
      delete safe.CONSENT_STATUS;
      delete safe.OPT_IN;
      delete safe.EXT_ID;
      const r = await api("PUT", `/contacts/${encodeURIComponent(job.match.email)}`, { attributes: safe });
      if (!r.ok) out.errors.push(`${job.l.name}: ${JSON.stringify(r.data)}`);
      return;
    }
    const prev = await api("GET", `/contacts/${encodeURIComponent(job.l.id)}?identifierType=ext_id`);
    if (prev.ok) {
      const r = await api("PUT", `/contacts/${encodeURIComponent(job.l.id)}?identifierType=ext_id`, {
        attributes: job.attributes,
        listIds: [listId],
      });
      if (r.ok) out.updated.push(job.l.name);
      else out.errors.push(`${job.l.name}: ${JSON.stringify(r.data)}`);
    } else {
      const body = { attributes: job.attributes, listIds: [listId], updateEnabled: true, ext_id: job.l.id };
      if (job.email) body.email = job.email;
      const r = await api("POST", "/contacts", body);
      if (r.ok) out.created.push(job.l.name);
      else out.errors.push(`${job.l.name}: ${JSON.stringify(r.data)}`);
    }
  });
}

const listingStatusCounts = { prospect: 0, verified: 0, blank: 0 };
if (KEY) {
  // Re-read after writes (or for dry-run confirmation of current state).
  const contacts = DRY ? existing : await fetchAllContacts();
  for (const c of contacts) {
    const v = c.attributes?.LISTING_STATUS;
    if (v === 1 || v === "1" || v === "Prospect listed") listingStatusCounts.prospect++;
    else if (v === 2 || v === "2" || v === "Verified listed") listingStatusCounts.verified++;
    else listingStatusCounts.blank++;
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      listId,
      attrsCreated,
      contactsFetched: existing.length,
      listingStatusCounts,
      counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])),
      ...out,
    },
    null,
    2,
  ),
);
