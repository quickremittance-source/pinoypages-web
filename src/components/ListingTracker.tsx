"use client";
import { useEffect } from "react";
import { track } from "@/lib/gtag";

/**
 * Fires listing_view once, and click_call / click_directions / click_website / click_messenger for any
 * element inside the page marked data-track="<event>". Mark the click_* events as Key events in GA4.
 */
export function ListingTracker({ id, name, category }: { id: string; name: string; category: string }) {
  useEffect(() => {
    const base = { business_id: id, business_name: name, category };
    track("listing_view", base);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (el?.dataset.track) track(el.dataset.track, base);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [id, name, category]);
  return null;
}
