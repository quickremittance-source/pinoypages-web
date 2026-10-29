// Region report: listings and events by city, and anything outside the GTA (flagged, never deleted).
// Usage: node scripts/region-report.mjs   (reads content files only; no database, no network)
import { readFile } from "node:fs/promises";

const src = await readFile("src/lib/regions.ts", "utf8");
const gta = src
  .match(/cities: \[([\s\S]*?)\]/)[1]
  .match(/"([^"]+)"/g)
  .map((x) => x.slice(1, -1).toLowerCase());
const inGta = (c) => !!c && gta.includes(String(c).trim().toLowerCase());
const { listings } = JSON.parse(await readFile("content/public-listings.json", "utf8"));
const { events } = JSON.parse(await readFile("content/guide.json", "utf8"));
const count = (xs, k) => xs.reduce((m, x) => ((m[x[k] ?? "(none)"] = (m[x[k] ?? "(none)"] ?? 0) + 1), m), {});
console.log(`Listings: ${listings.length}`);
console.table(count(listings, "area"));
const outL = listings.filter((l) => !inGta(l.area));
console.log(
  `Listings outside GTA: ${outL.length}`,
  outL.map((l) => `${l.id} (${l.area})`),
);
console.log(`Events: ${events.length}`);
console.table(count(events, "city"));
const outE = events.filter((e) => !inGta(e.city));
console.log(
  `Events not tied to a GTA city: ${outE.length}`,
  outE.map((e) => `${e.id} (${e.city ?? "none"})`),
);
