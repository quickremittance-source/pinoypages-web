import { notFound, redirect } from "next/navigation";
import { isAdmin } from "@/lib/adminSession";
import { safeAdminNext } from "@/lib/adminReturn";

/**
 * Page-level admin gate. Signed out (or cookie missing after a cross-site link, SameSite=Strict):
 * send to sign-in with a safe local return path. If admin sign-in is not configured, stay a plain 404.
 */
export async function requireAdmin(returnPath: string) {
  if (await isAdmin()) return;
  if (!process.env.ADMIN_KEY) notFound();
  redirect(`/admin/login?next=${encodeURIComponent(safeAdminNext(returnPath))}`);
}
