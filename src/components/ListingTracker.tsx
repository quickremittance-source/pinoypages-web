"use client";
import { useEffect } from "react";
import { track } from "@/lib/gtag";

/**
 * Fires listing_view once, and click_call / click_directions / click_website / click_messenger for any
 * element inside the page marked data-track="<event>". Mark the click_* events as Key events in GA4.
 */
type Base = {
  listing_id: string;
  business_id: string;
  business_name: string;
  category: string;
  verified: string;
  listing_tier: string;
};
export function ListingTracker({ base }: { base: Base }) {
  const key = JSON.stringify(base);
  useEffect(() => {
    const b = JSON.parse(key) as Base;
    track("listing_view", b);
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-track]");
      if (el?.dataset.track) track(el.dataset.track, b);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [key]);
  return null;
}
