"use client";
import Link from "next/link";
import { AdView } from "@/components/AdSlot";
import { activeAds } from "@/lib/ads";
import { track } from "@/lib/gtag";
import { RATES_NOTE } from "@/lib/adSizes";

/**
 * Featured travel slot on each destination page. Shows the sold ad when one is active for this
 * destination; otherwise an "available" notice. Never shows prices.
 */
export function TravelAdSlot({ slotId, destination }: { slotId: string; destination: string }) {
  const sold = activeAds("travel-featured", { category: destination })[0];
  if (sold) {
    return (
      <div data-slot-id={slotId} data-slot="travel-featured">
        <AdView ad={sold} />
      </div>
    );
  }
  return (
    <aside
      data-slot-id={slotId}
      data-slot="travel-featured"
      aria-label="Featured travel advertising space"
      className="card border-2 border-dashed border-turqdk/40 p-5"
    >
      <p className="kicker">Featured travel</p>
      <p className="mt-1 text-lg font-bold text-ink">Your travel business here</p>
      <p className="mt-1 text-sm text-muted">
        For travel agencies, cargo and balikbayan box services, remittance and travel insurance businesses serving the
        GTA&apos;s Filipino community.
      </p>
      <p className="mt-3 text-sm font-semibold text-sea" data-testid="travel-rates">
        {RATES_NOTE}
      </p>
      <Link
        href={`/advertise?slot=${encodeURIComponent(slotId)}`}
        className="btn btn-ghost mt-3 text-sm"
        onClick={() =>
          track("ad_click", {
            ad_id: slotId,
            advertiser_id: "house",
            business_id: "",
            slot_position: 1,
            placement: "travel-featured",
            campaign: "travel-slot-available",
            start_date: "",
            end_date: "",
          })
        }
      >
        Ask about this space
      </Link>
      <p className="mt-2 text-[11px] text-muted">Slot ID: {slotId}</p>
    </aside>
  );
}
