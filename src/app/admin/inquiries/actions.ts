"use server";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { revalidateListings } from "@/lib/revalidateListings";
import { assertAdmin } from "@/lib/adminSession";
import { DECISIONS, type Decision } from "@/lib/onboarding";
import { addQr, decide, markVerified } from "@/lib/onboardingDb";

const keyOf = async () => assertAdmin();
const back = (_: unknown, path: string, msg: string) =>
  redirect(`${path}${path.includes("?") ? "&" : "?"}msg=${encodeURIComponent(msg)}`);

export async function decideAction(fd: FormData) {
  const k = await keyOf();
  const d = String(fd.get("d")) as Decision;
  if (!DECISIONS.includes(d)) throw new Error("bad decision");
  let msg: string;
  try {
    msg = `#${fd.get("id")}: ${await decide(Number(fd.get("id")), d)}`;
    if (d === "approve") {
      revalidateListings();
      revalidateTag("dash");
    }
  } catch (e) {
    msg = `#${fd.get("id")}: ${(e as Error).message}`;
  }
  back(k, "/admin/inquiries", msg);
}

export async function addQrAction(fd: FormData) {
  const k = await keyOf();
  const listing = String(fd.get("listing"));
  const label = String(fd.get("label") ?? "").trim().slice(0, 60);
  const msg = label ? `added ${await addQr(listing, label)}` : "label required";
  back(k, `/admin/welcome/${encodeURIComponent(listing)}`, msg);
}

export async function verifyAction(fd: FormData) {
  const k = await keyOf();
  if (fd.get("confirm") !== "on") back(k, `/admin/welcome/${encodeURIComponent(String(fd.get("listing")))}`, "tick the live video check box first");
  const listing = String(fd.get("listing"));
  const until = await markVerified(listing);
  revalidateListings();
  back(k, `/admin/welcome/${encodeURIComponent(listing)}`, `Verified until ${until}`);
}
