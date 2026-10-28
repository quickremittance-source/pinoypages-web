import "server-only";
import { isFeaturedEvent, listingById } from "@/lib/guide";
import { isBot, monthKey, type EventName } from "./events";
import { store } from "./store";
import { isAdStatId } from "@/lib/adLanding";
import { recordAdEvent } from "@/lib/adsRepo";

/** Record one event for a known listing. Never throws; stores only listing id, event and month. */
export async function track(listingId: string, event: EventName, ua: string | null, by = 1): Promise<boolean> {
  // Known listings, featured events and QR ad pages ("ad:<slug>") (counted like a paid listing).
  if (isBot(ua)) return false;
  // QR ad pages: Neon when DATABASE_URL is set (validates slug + tracking id there), else JSON + generic store.
  if (listingId.startsWith("ad:")) {
    try {
      const r = await recordAdEvent(listingId, event, monthKey());
      if (r !== null) return r;
    } catch (e) {
      console.warn("[stat] ad db write failed", (e as Error).message);
      return false;
    }
    if (!isAdStatId(listingId)) return false;
  } else if (!listingById(listingId) && !isFeaturedEvent(listingId)) return false;
  try {
    await store().increment(listingId, event, monthKey(), by);
    console.info("[stat]", listingId, event);
    return true;
  } catch (e) {
    console.warn("[stat] store failed", (e as Error).message);
    return false;
  }
}
