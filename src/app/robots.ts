import type { MetadataRoute } from "next";
import { abs } from "@/lib/guide";
import { ALLOW_INDEXING } from "@/lib/seo";
// Private preview: crawlers stay blocked unless ALLOW_INDEXING=true (default off, owner's choice).
export default function robots(): MetadataRoute.Robots {
  if (!ALLOW_INDEXING) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/q/", "/ad/"] },
    sitemap: abs("/sitemap.xml"),
  };
}
