import type { MetadataRoute } from "next";
import { abs, categories, isPaid, listings, sections } from "@/lib/guide";
import { articles } from "@/lib/magazine";
import { liveTools } from "@/lib/registry";
export default function sitemap(): MetadataRoute.Sitemap {
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
  );
  return paths.map((p) => ({ url: abs(p) }));
}
