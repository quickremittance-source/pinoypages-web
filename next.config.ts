import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";
const ga = !!process.env.NEXT_PUBLIC_GA_ID;
const allowIndexing = process.env.ALLOW_INDEXING === "true";
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}${ga ? " https://www.googletagmanager.com" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data:${ga ? " https://*.google-analytics.com https://*.googletagmanager.com" : ""}`,
  "font-src 'self'",
  `connect-src 'self'${ga ? " https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com" : ""}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async redirects() {
    return [
      // Tools removed (Jose, Nov 5): send old /tools URLs to Magazine.
      { source: "/tools", destination: "/magazine", permanent: true },
      { source: "/tools/:path*", destination: "/magazine", permanent: true },
      { source: "/deadlines", destination: "/calendar?type=deadline", permanent: true },
      // Deadlines merged into the calendar (Jose, Nov 3).
      { source: "/tax-deadlines", destination: "/calendar?type=deadline", permanent: true },
      // Tagalog Get Listed page retired (Jose, 30 Oct): fall back to the English article.
      { source: "/magazine/get-listed/tl", destination: "/magazine/get-listed", permanent: false },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
          { key: "X-Frame-Options", value: "DENY" },
          // Private until Jose approves launch: noindex unless ALLOW_INDEXING=true.
          ...(allowIndexing ? [] : [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]),
        ],
      },
    ];
  },
};
export default nextConfig;
