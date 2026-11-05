"use server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { assertAdmin } from "@/lib/adminSession";
import { parseLandingForm, parseListingAction, parseQrLabel } from "@/lib/adminZcard";
import { createZcardCode, linkZcardListing, unlinkZcardListing, updateZcardLanding } from "@/lib/adminZcardDb";
import { revalidateListings } from "@/lib/revalidateListings";

const back = (path: string, msg: string): never =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);

const refresh = () => {
  revalidateListings();
  revalidateTag("dash");
  revalidateTag("ads");
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

const slugOf = (fd: FormData) => {
  const slug = String(fd.get("slug") ?? "");
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error("bad slug");
  return slug;
};

export async function createQrAction(fd: FormData) {
  await assertAdmin();
  const slug = slugOf(fd);
  try {
    const label = parseQrLabel(String(fd.get("label") ?? ""));
    const code = await createZcardCode(slug, label);
    refresh();
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=qr`, `Created QR code ${code}.`);
  } catch (e) {
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=qr`, (e as Error).message);
  }
}

export async function saveLandingAction(fd: FormData) {
  await assertAdmin();
  const slug = slugOf(fd);
  try {
    const p = parseLandingForm(fd);
    const msg = await run(() => updateZcardLanding(slug, p), "Landing copy saved.");
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=landing`, msg);
  } catch (e) {
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=landing`, (e as Error).message);
  }
}

export async function listingAction(fd: FormData) {
  await assertAdmin();
  const slug = slugOf(fd);
  try {
    const a = parseListingAction(fd);
    const msg =
      a.op === "unlink"
        ? await run(
            () => unlinkZcardListing(slug),
            "Unlinked. The listing, ad, QR codes and analytics were not deleted.",
          )
        : await run(() => linkZcardListing(slug, a.listingId), `Linked listing ${a.listingId}.`);
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=listing`, msg);
  } catch (e) {
    back(`/admin/zcard/${encodeURIComponent(slug)}?tab=listing`, (e as Error).message);
  }
}
