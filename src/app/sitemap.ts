import type { MetadataRoute } from "next";
import { abs, categories, events, isPaid, listings, sections } from "@/lib/guide";
import { articles } from "@/lib/magazine";
import { liveTools } from "@/lib/registry";
import { publicListings } from "@/lib/public";
import { bizPath, landings } from "@/lib/seo";
import { listZcards } from "@/lib/adsRepo";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paths = [
    "/",
    "/tax-deadlines",
    "/directory",
    "/edition",
    "/magazine",
    "/calendar",
    "/advertise",
    "/upgrade",
    "/get-verified",
    "/awards",
    "/list-free",
    "/privacy",
    "/terms",
  ].concat(
    liveTools.map((t) => t.route),
    sections.filter((s) => s.status === "live").map((s) => `/directory/${s.slug}`),
    categories.map((c) => `/directory/${c.slug}`),
    articles.map((a) => `/magazine/${a.slug}`),
    articles.filter((a) => a.tl).map((a) => `/magazine/${a.slug}/tl`),
    listings.map((l) => `/listing/${l.id}`),
    listings.filter(isPaid).map((l) => `/card/${l.id}`),
    events.map((e) => `/calendar/${e.id}`),
    publicListings.map(bizPath),
    landings.map((l) => `/${l.slug}`),
    // zcard section: not linked from the directory, but listed here so search engines can find it once indexed.
    ["/zcard"],
    (await listZcards().catch(() => [])).map((a) => `/zcard/${a.slug}`),
  );
  return paths.map((p) => ({ url: abs(p) }));
}
