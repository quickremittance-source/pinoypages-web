import "server-only";
import { isFeaturedEvent, listingById } from "@/lib/guide";
import { isBot, monthKey, type EventName } from "./events";
import { store } from "./store";

/** Record one event for a known listing. Never throws; stores only listing id, event and month. */
export async function track(listingId: string, event: EventName, ua: string | null, by = 1): Promise<boolean> {
  // Known listings, plus featured events (counted like a paid listing).
  if ((!listingById(listingId) && !isFeaturedEvent(listingId)) || isBot(ua)) return false;
  try {
    await store().increment(listingId, event, monthKey(), by);
    console.info("[stat]", listingId, event);
    return true;
  } catch (e) {
    console.warn("[stat] store failed", (e as Error).message);
    return false;
  }
}
