"use client";

import { useEffect } from "react";
import { track } from "@/lib/gtag";

/** Fire a GA4 event (no-op without GA ID). Playwright can assert via window.__ppEvents. */
export function FoodSearchBeacon({
  city,
  type,
  dish,
  open,
  count,
}: {
  city: string;
  type: string;
  dish: string;
  open: boolean;
  count: number;
}) {
  useEffect(() => {
    track("food_search", {
      city: city || undefined,
      food_type: type || undefined,
      dish: dish || undefined,
      open_now: open ? 1 : 0,
      result_count: count,
    });
  }, [city, type, dish, open, count]);
  return null;
}

export function DishTagButton({
  tag,
  listingId,
  tier,
  href,
}: {
  tag: string;
  listingId: string;
  tier: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-semibold text-ink hover:bg-aqua"
      data-testid="dish-tag"
      data-tag={tag}
      onClick={() => track("dish_tag_click", { dish: tag, listing_id: listingId, tier })}
    >
      {tag}
    </a>
  );
}

export function MenuLink({
  href,
  listingId,
  tier,
  children,
}: {
  href: string;
  listingId: string;
  tier: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      rel="nofollow noopener"
      target="_blank"
      className="font-semibold text-turqdk underline"
      data-testid="menu-link"
      onClick={() => track("menu_view", { listing_id: listingId, tier })}
    >
      {children}
    </a>
  );
}
