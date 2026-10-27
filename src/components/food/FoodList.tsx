import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { DishTagButton, MenuLink } from "@/components/food/FoodTrack";
import {
  FOOD_COPY,
  FOOD_TYPES,
  bi,
  foodHref,
  foodJsonLd,
  foodListingHref,
  formatMenuDate,
  isMenuStale,
  type FoodListing,
} from "@/lib/food";
import { abs } from "@/lib/guide";

export function FoodList({ items }: { items: FoodListing[] }) {
  if (items.length === 0) {
    return (
      <div
        role="status"
        data-testid="food-empty"
        className="rounded-xl border-2 border-dashed border-ink/20 bg-white p-8 text-center"
      >
        <p className="text-lg font-semibold text-ink">{FOOD_COPY.empty.en}</p>
        <p className="mt-1 text-muted">{FOOD_COPY.empty.tl}</p>
        <p className="mt-4 text-sm text-muted">{bi(FOOD_COPY.claimPrompt)}</p>
        <Link href="/list-free" className="btn mt-4 inline-block">
          List your business free
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4" data-testid="food-list">
      {items.map((l) => {
        const href = foodListingHref(l);
        const absUrl = abs(href);
        const typeLabel = FOOD_TYPES[l.foodType];
        const menuDate = formatMenuDate(l.menuUpdatedAt);
        const stale = isMenuStale(l.menuUpdatedAt);
        return (
          <li
            key={l.listing_id}
            className="card p-4"
            data-listing-id={l.listing_id}
            data-food-type={l.foodType}
            data-tier={l.effectiveTier}
            data-city={l.area}
          >
            <JsonLd data={foodJsonLd(l, absUrl)} />
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link href={href} className="text-lg font-bold text-ink hover:underline">
                {l.name}
              </Link>
              <span className="rounded-md bg-sand px-2 py-0.5 text-xs font-bold text-ink">
                {typeLabel.en}
                <span className="sr-only"> · {typeLabel.tl}</span>
              </span>
              <span className="text-sm text-muted">
                {l.area}
                {l.address ? ` · ${l.address}` : ""}
              </span>
            </div>
            {l.phone && (
              <p className="mt-1 text-sm">
                <a href={`tel:${l.phone.replace(/[^0-9+]/g, "")}`} className="text-turqdk underline">
                  {l.phone}
                </a>
              </p>
            )}
            {l.dishTags.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5" aria-label={bi(FOOD_COPY.dish)}>
                {l.dishTags.map((tag) => (
                  <DishTagButton
                    key={tag}
                    tag={tag}
                    listingId={l.listing_id}
                    tier={l.effectiveTier}
                    href={foodHref({ dish: tag })}
                  />
                ))}
              </div>
            )}
            {l.menuUrl && (
              <p className="mt-3 text-sm">
                <MenuLink href={l.menuUrl} listingId={l.listing_id} tier={l.effectiveTier}>
                  {bi(FOOD_COPY.menu)}
                </MenuLink>
                {menuDate && (
                  <span className="ml-2 text-muted">
                    · {FOOD_COPY.lastUpdated.en}: {menuDate}
                  </span>
                )}
                {stale && (
                  <span
                    className="ml-2 rounded bg-sand px-1.5 py-0.5 text-xs font-bold text-coral-dk"
                    data-testid="menu-stale"
                  >
                    {FOOD_COPY.stale.en}
                  </span>
                )}
              </p>
            )}
            {l.featuredDishes.length > 0 && (
              <div className="mt-2 text-sm" data-testid="featured-dishes">
                <span className="font-semibold">{bi(FOOD_COPY.featured)}: </span>
                {l.featuredDishes.map((d) => d.name).join(", ")}
                {formatMenuDate(l.featuredUpdatedAt) && (
                  <span className="ml-2 text-muted">
                    · {FOOD_COPY.lastUpdated.en}: {formatMenuDate(l.featuredUpdatedAt)}
                  </span>
                )}
              </div>
            )}
            <p className="mt-3 text-xs text-muted">
              {FOOD_COPY.claimPrompt.en}{" "}
              <Link href={`/upgrade?listing=${l.id}`} className="font-semibold text-turqdk underline">
                Claim this listing
              </Link>
              {" · "}
              <a href={`#suggest-${l.listing_id}`} className="font-semibold text-turqdk underline">
                {FOOD_COPY.suggest.en}
              </a>
            </p>
          </li>
        );
      })}
    </ul>
  );
}
