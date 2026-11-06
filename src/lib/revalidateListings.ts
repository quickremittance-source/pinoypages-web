import "server-only";
import { revalidatePath, revalidateTag } from "next/cache";
import { LISTINGS_TAG } from "@/lib/listingsRepo";

/** Call from server actions after any listing change (onboarding approve, hide/publish). */
export function revalidateListings() {
  revalidateTag(LISTINGS_TAG);
  revalidatePath("/");
  revalidatePath("/");
}
