import { revalidatePath, revalidateTag } from "next/cache";
import { validAdminKey } from "@/lib/analytics/token";
import { LISTINGS_TAG } from "@/lib/listingsRepo";

/**
 * POST /api/revalidate with header `x-admin-key: <ADMIN_KEY>`. Drops the cached listing set (tag "listings"),
 * so directory/category/area counters rebuild on the next request. Key only in a header, never in the URL.
 */
export async function POST(req: Request) {
  if (!validAdminKey(req.headers.get("x-admin-key"))) return new Response("Not found", { status: 404 });
  revalidateTag(LISTINGS_TAG);
  for (const p of ["/"]) revalidatePath(p);
  revalidatePath("/directory/[category]", "page");
  return Response.json({ ok: true, revalidated: [LISTINGS_TAG] }, { headers: { "cache-control": "no-store" } });
}
export const GET = () => new Response("Not found", { status: 404 });
