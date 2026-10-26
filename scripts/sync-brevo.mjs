#!/usr/bin/env node
// Sync website listings into Brevo as contacts in "Pinoy Pages — Website Listings".
// Idempotent: contacts are keyed by EXT_ID = listing id. Sends nothing; never touches other lists.
// CASL: listings are publicly sourced, no consent -> CONSENT_STATUS="none - publicly sourced", OPT_IN=false.
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

async function api(method, path, body) {
  const r = await fetch(API + path, {
    method,
    headers: { "api-key": KEY, "content-type": "application/json", accept: "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const t = await r.text();
  return { ok: r.ok, status: r.status, data: t ? JSON.parse(t) : null };
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
  const { data: d } = await api("GET", "/contacts/attributes");
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
  const { data: d } = await api("GET", "/contacts/lists?limit=50");
  const found = d.lists.find((l) => l.name === LIST_NAME);
  if (found) return found.id;
  if (DRY) return "(new)";
  const folderId = d.lists[0]?.folderId ?? 1;
  const r = await api("POST", "/contacts/lists", { name: LIST_NAME, folderId });
  if (!r.ok) throw new Error(JSON.stringify(r.data));
  return r.data.id;
}

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const out = { created: [], updated: [], skipped: [], matchedExisting: [], errors: [] };

const attrsCreated = DRY && !KEY ? [] : await ensureAttributes();
const listId = DRY && !KEY ? "(new)" : await ensureList();

let existing = [];
if (KEY) {
  const r = await api("GET", "/contacts?limit=1000");
  existing = r.data?.contacts || [];
}
const byName = new Map(
  existing
    .filter((c) => c.attributes?.BUSINESS_NAME && c.email && !c.attributes?.LISTING_SLUG)
    .map((c) => [norm(c.attributes.BUSINESS_NAME), c]),
);
const usedSms = new Map();

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
    // Existing contact: only add attributes, leave list memberships and consent fields alone.
    out.matchedExisting.push(`${l.name} -> ${match.email}`);
    if (!DRY) {
      const safe = { ...attributes };
      delete safe.CONSENT_STATUS;
      delete safe.OPT_IN;
      delete safe.EXT_ID;
      const r = await api("PUT", `/contacts/${encodeURIComponent(match.email)}`, { attributes: safe });
      if (!r.ok) out.errors.push(`${l.name}: ${JSON.stringify(r.data)}`);
    }
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
  if (DRY) {
    out.created.push(`${l.name} [${email || sms}]`);
    continue;
  }
  const prev = await api("GET", `/contacts/${encodeURIComponent(l.id)}?identifierType=ext_id`);
  if (prev.ok) {
    const r = await api("PUT", `/contacts/${encodeURIComponent(l.id)}?identifierType=ext_id`, {
      attributes,
      listIds: [listId],
    });
    if (r.ok) out.updated.push(l.name);
    else out.errors.push(`${l.name}: ${JSON.stringify(r.data)}`);
  } else {
    const body = { attributes, listIds: [listId], updateEnabled: true, ext_id: l.id };
    if (email) body.email = email;
    const r = await api("POST", "/contacts", body);
    if (r.ok) out.created.push(l.name);
    else out.errors.push(`${l.name}: ${JSON.stringify(r.data)}`);
  }
}

console.log(
  JSON.stringify(
    {
      dryRun: DRY,
      listId,
      attrsCreated,
      counts: Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])),
      ...out,
    },
    null,
    2,
  ),
);
