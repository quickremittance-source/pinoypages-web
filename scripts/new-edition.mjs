// Rolls the yearly template forward: writes content/guide.<next>.json for review (never overwrites guide.json).
// Bumps edition label, UTM campaign and every date by one year; sold ads become "renewal" (offered to the same
// member first, at the locked pilot price minus the member renewal discount); listings and page order are kept.
import { readFileSync, writeFileSync } from "node:fs";
const g = JSON.parse(readFileSync(new URL("../content/guide.json", import.meta.url)));
const [y1, y2] = g.brand.edition.split(/[–-]/).map(Number);
const next = `${y1 + 1}–${y2 + 1}`; // e.g. 2026–2027 -> 2027–2028
const bump = (d) => `${Number(d.slice(0, 4)) + 1}${d.slice(4)}`;
g.brand.edition = next;
g.brand.editionLabel = `${next} Edition`;
g.brand.editionName = `${g.brand.name} ${next}`;
g.brand.utmCampaign = `pp${String(y1 + 1).slice(2)}${String(y2 + 1).slice(2)}`;
g.dates = Object.fromEntries(Object.entries(g.dates).map(([k, v]) => [k, bump(v)]));
g.renewal.nextOnTimeDeadline = bump(g.renewal.nextOnTimeDeadline);
g.ads = g.ads.map((a) => (a.status === "sold" ? { ...a, status: "renewal" } : a));
const out = new URL(`../content/guide.${y1 + 1}-${y2 + 1}.json`, import.meta.url);
writeFileSync(out, JSON.stringify(g, null, 2) + "\n");
console.log(`Wrote ${out.pathname} (${g.brand.editionLabel}); review, then replace guide.json when ready.`);
