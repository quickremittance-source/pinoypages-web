import { NextResponse, type NextRequest } from "next/server";
import { devFeaturesEnabled, isDevOnlyPath } from "@/lib/devMode";

/** Hide dev-mode-only products (Foodie, Traveller) in Production: plain 404, cacheable at the edge. */
export function middleware(req: NextRequest) {
  if (!devFeaturesEnabled() && isDevOnlyPath(req.nextUrl.pathname)) {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "X-Robots-Tag": "noindex, nofollow", "Cache-Control": "public, max-age=300" },
    });
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/food/:path*",
    "/foodie/:path*",
    "/food-finder/:path*",
    "/filipino-foodie/:path*",
    "/travel/:path*",
    "/explorer/:path*",
    "/balikbayan/:path*",
    "/traveller/:path*",
    "/kabayan-traveller/:path*",
  ],
};
