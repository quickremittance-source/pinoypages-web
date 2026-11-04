"use server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { validAdminKey } from "@/lib/analytics/token";
import { parseAdForm, parseListingForm } from "@/lib/adminEdit";
import {
  AD_OPS,
  adOp,
  deleteAd,
  deleteListing,
  LISTING_OPS,
  listingOp,
  updateAd,
  updateListing,
  type AdOp,
  type ListingOp,
} from "@/lib/adminEditDb";
import { revalidateListings } from "@/lib/revalidateListings";

const keyOf = (fd: FormData) => {
  const k = String(fd.get("key") ?? "");
  if (!validAdminKey(k)) throw new Error("forbidden");
  return k;
};
const back = (k: string, path: string, msg: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}key=${encodeURIComponent(k)}&msg=${encodeURIComponent(msg)}`);
/** Every change: refresh the public listing cache (directory, counters) and the 5-min admin dashboards. */
const refresh = () => {
  revalidateListings();
  revalidateTag("dash");
};
const run = async (fn: () => Promise<boolean>, ok: string) => {
  try {
    if (!(await fn())) return "Nothing changed (not found, or not allowed in its current state).";
    refresh();
    return ok;
  } catch (e) {
    return (e as Error).message;
  }
};

export async function saveListingAction(fd: FormData) {
  const k = keyOf(fd);
  const id = String(fd.get("listing_id"));
  let msg: string;
  try {
    const p = parseListingForm(fd);
    msg = await run(() => updateListing(id, p), "Saved.");
  } catch (e) {
    msg = (e as Error).message;
  }
  back(k, `/admin/listings/${encodeURIComponent(id)}`, msg);
}

export async function listingOpAction(fd: FormData) {
  const k = keyOf(fd);
  const id = String(fd.get("listing_id"));
  const op = String(fd.get("op"));
  if (op === "delete") {
    if (fd.get("confirm") !== "DELETE")
      back(k, `/admin/listings/${encodeURIComponent(id)}`, "Type DELETE to confirm a permanent delete.");
    const msg = await run(() => deleteListing(id), `Deleted ${id} permanently (audit keeps a copy).`);
    back(k, "/admin/listings?status=archived", msg);
  }
  if (!(op in LISTING_OPS)) throw new Error("bad op");
  if (op === "archive" && fd.get("confirm") !== "on")
    back(k, `/admin/listings/${encodeURIComponent(id)}`, "Tick the box to confirm Delete (archive).");
  const msg = await run(() => listingOp(id, op as ListingOp), `Done: ${op}.`);
  back(k, `/admin/listings/${encodeURIComponent(id)}`, msg);
}

export async function saveAdAction(fd: FormData) {
  const k = keyOf(fd);
  const slug = String(fd.get("slug"));
  let msg: string;
  try {
    const p = parseAdForm(fd);
    msg = await run(() => updateAd(slug, p), "Saved.");
  } catch (e) {
    msg = (e as Error).message;
  }
  back(k, `/admin/ads/${encodeURIComponent(slug)}`, msg);
}

export async function adOpAction(fd: FormData) {
  const k = keyOf(fd);
  const slug = String(fd.get("slug"));
  const op = String(fd.get("op"));
  if (op === "delete") {
    if (fd.get("confirm") !== "DELETE")
      back(k, `/admin/ads/${encodeURIComponent(slug)}`, "Type DELETE to confirm a permanent delete.");
    const msg = await run(() => deleteAd(slug), `Deleted ${slug} permanently (audit keeps a copy).`);
    back(k, "/admin/ads/manage?show=archived", msg);
  }
  if (!(op in AD_OPS)) throw new Error("bad op");
  if (op === "archive" && fd.get("confirm") !== "on")
    back(k, `/admin/ads/${encodeURIComponent(slug)}`, "Tick the box to confirm Delete (archive).");
  const msg = await run(() => adOp(slug, op as AdOp), `Done: ${op}.`);
  back(k, `/admin/ads/${encodeURIComponent(slug)}`, msg);
}
