"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { activeAds, type AdDef, type Placement } from "@/lib/ads";
import { setAdCtx, track } from "@/lib/gtag";

const params = (a: AdDef) => ({
  ad_id: a.ad_id,
  advertiser_id: a.advertiser_id,
  business_id: a.business_id,
  slot_position: a.slot_position,
  placement: a.placement,
  campaign: a.campaign,
  start_date: a.start_date,
  end_date: a.end_date,
});

function withCtx(a: AdDef) {
  const sep = a.href.includes("?") ? "&" : "?";
  return `${a.href}${sep}utm_source=pinoypages&utm_medium=${a.placement}&utm_campaign=${encodeURIComponent(a.campaign)}&ad_id=${encodeURIComponent(a.ad_id)}`;
}

/** One paid ad: ad_impression once per view (IntersectionObserver, ≥50% visible), ad_click on click. */
export function AdView({ ad }: { ad: AdDef }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let seen = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (!seen && entries.some((e) => e.isIntersecting)) {
          seen = true;
          track("ad_impression", params(ad));
          io.disconnect();
        }
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ad]);
  return (
    <aside
      ref={ref}
      data-ad={ad.ad_id}
      data-placement={ad.placement}
      data-slot-position={ad.slot_position}
      className="card p-5"
      aria-label="Sponsored"
    >
      <p className="kicker">Sponsored</p>
      <Link
        href={withCtx(ad)}
        className="mt-1 block text-lg font-bold text-ink underline"
        onClick={() => {
          setAdCtx({ ad_id: ad.ad_id, campaign: ad.campaign, placement: ad.placement });
          track("ad_click", params(ad));
        }}
      >
        {ad.headline}
      </Link>
    </aside>
  );
}

/** Renders active ads for a placement; nothing at all when none are sold. */
export function AdSlot({ placement, category, list }: { placement: Placement; category?: string; list?: AdDef[] }) {
  const items = activeAds(placement, { category }, list);
  if (!items.length) return null;
  return (
    <div className="space-y-3" data-slot={placement}>
      {items.map((a) => (
        <AdView key={a.ad_id} ad={a} />
      ))}
    </div>
  );
}
