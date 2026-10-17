import type { MetadataRoute } from "next";
// Private preview: block all crawlers until launch is approved.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
