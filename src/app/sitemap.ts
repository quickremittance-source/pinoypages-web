import type { MetadataRoute } from "next";
import { abs, categories, events, isPaid, listings, sections } from "@/lib/guide";
import { articles } from "@/lib/magazine";
import { liveTools } from "@/lib/registry";
import { publicListings } from "@/lib/public";
import { bizPath, landings } from "@/lib/seo";
import { AREAS } from "@/lib/foodie/areas";
import { getDishes, getRestaurants, getVideos } from "@/lib/foodie/data";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [ffR, ffD, ffV] = await Promise.all([getRestaurants(), getDishes(), getVideos()]);
  const ff = "/filipinofoodie";
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
    [
      ff,
      ...["restaurants", "dish", "videos", "delicacies", "catering", "groceries", "promos", "claim", "legal"].map(
        (x) => `${ff}/${x}`,
      ),
    ],
    AREAS.filter((a) => ffR.some((r) => r.area === a.slug)).map((a) => `${ff}/gta/${a.slug}`),
    ffR.map((r) => `${ff}/restaurants/${r.slug}`),
    ffD.map((d) => `${ff}/dish/${d.slug}`),
    ffV.map((v) => `${ff}/videos/${v.youtubeId}`),
  );
  return paths.map((p) => ({ url: abs(p) }));
}
