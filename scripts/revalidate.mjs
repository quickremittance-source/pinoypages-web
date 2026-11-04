// Tell the live site to drop its cached listings (tag "listings") after a sync or data load.
// Uses SITE_URL (default https://pinoypages.ca) and ADMIN_KEY, sent as a header only; never printed.
// Usage: import { revalidateListings } from "./revalidate.mjs"  or  node scripts/revalidate.mjs
export async function revalidateListings() {
  const key = process.env.ADMIN_KEY;
  const base = (process.env.SITE_URL || "https://pinoypages.ca").replace(/\/$/, "");
  if (!key) {
    console.warn("revalidate: ADMIN_KEY not set; skipped (cache expires within 1 hour).");
    return false;
  }
  try {
    const r = await fetch(`${base}/api/revalidate`, { method: "POST", headers: { "x-admin-key": key } });
    console.log(`revalidate: ${base}/api/revalidate -> ${r.status}`);
    return r.ok;
  } catch (e) {
    console.warn(`revalidate: failed (${e instanceof Error ? e.message : e}); cache expires within 1 hour.`);
    return false;
  }
}
if (import.meta.url === `file://${process.argv[1]}`) process.exit((await revalidateListings()) ? 0 : 1);
