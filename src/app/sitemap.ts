import type { MetadataRoute } from "next";
import { abs, categories, destinations, listings } from "@/lib/guide";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "/",
    "/tools/hst",
    "/tools/cpp",
    "/deadlines",
    "/directory",
    "/destinations",
    "/advertise",
    "/upgrade",
    "/privacy",
  ].concat(
    categories.map((c) => `/directory/${c.slug}`),
    destinations.map((d) => `/destinations/${d.slug}`),
    listings.map((l) => `/listing/${l.id}`),
  );
  return paths.map((p) => ({ url: abs(p) }));
}
