// Builds the print flat plan + QR target list from the SAME data the website uses.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
const g = JSON.parse(readFileSync(new URL("../content/guide.json", import.meta.url)));
const base = process.env.NEXT_PUBLIC_SITE_URL ?? g.brand.siteUrl;
const ads = Object.fromEntries(g.ads.map((a) => [a.id, a]));
const rows = [["page", "section", "title", "ads", "qr_url"]];
for (const p of g.pages) {
  const q = new URLSearchParams({
    utm_source: "guide",
    utm_medium: "qr",
    utm_campaign: g.brand.utmCampaign,
    utm_content: `p${p.page}`,
  });
  const adText = [p.ad, p.ad2]
    .filter(Boolean)
    .map((id) => `${id}:${ads[id].size}:${ads[id].status}`)
    .join(" | ");
  const qr = p.section === "cover" ? "" : `${base}${p.route === "/" ? "" : p.route}?${q}`;
  rows.push([p.page, p.section, p.title, adText, qr]);
}
const listings = g.categories.map((c) => ({
  page: c.page,
  category: c.name,
  listings: g.listings.filter((l) => l.category === c.slug),
}));
mkdirSync(new URL("../print/", import.meta.url), { recursive: true });
writeFileSync(
  new URL("../print/flatplan.csv", import.meta.url),
  rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n") + "\n",
);
writeFileSync(
  new URL("../print/print-data.json", import.meta.url),
  JSON.stringify({ brand: g.brand, pages: rows.slice(1), listings }, null, 2),
);
console.log(`print/flatplan.csv: ${rows.length - 1} pages, ${g.ads.length} ad slots, ${g.listings.length} listings`);
