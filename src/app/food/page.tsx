import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { FoodFilterForm } from "@/components/food/FoodFilterForm";
import { FoodList } from "@/components/food/FoodList";
import { FoodSearchBeacon } from "@/components/food/FoodTrack";
import { SuggestUpdateForm } from "@/components/food/SuggestUpdateForm";
import {
  FOOD_COPY,
  bi,
  filterFoodListings,
  foodFilterOptions,
  foodListings,
  parseFoodFilters,
} from "@/lib/food";

export const metadata: Metadata = {
  title: "Food Finder · Hanapin ang Pagkain",
  description: FOOD_COPY.intro.en,
  alternates: { canonical: "/food" },
  robots: { index: false, follow: false },
};

export default async function FoodPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFoodFilters(await searchParams);
  const all = foodListings();
  const filtered = filterFoodListings(all, filters);
  const { cities, anyHours } = foodFilterOptions(all);

  return (
    <>
      <PageHead kicker={bi(FOOD_COPY.kicker)} title={FOOD_COPY.title.en} intro={FOOD_COPY.intro.en}>
        <p className="mt-2 text-muted">{FOOD_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{FOOD_COPY.intro.tl}</p>
        <a href="#suggest-update" className="btn mt-4 inline-block">
          {bi(FOOD_COPY.suggest)}
        </a>
      </PageHead>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <FoodSearchBeacon
          city={filters.city}
          type={filters.type}
          dish={filters.dish}
          open={filters.open}
          count={filtered.length}
        />
        <FoodFilterForm filters={filters} cities={cities} anyHours={anyHours} resultCount={filtered.length} />
        <FoodList items={filtered} />
        <section aria-labelledby="suggest-heading" className="space-y-4">
          <h2 id="suggest-heading" className="text-2xl font-bold text-ink">
            {bi(FOOD_COPY.suggest)}
          </h2>
          <p className="text-muted">
            Tell us which dishes you serve or share your menu link. We review every suggestion before anything appears
            on the site.
          </p>
          <SuggestUpdateForm
            listings={all.map((l) => ({
              listing_id: l.listing_id,
              id: l.id,
              name: l.name,
              effectiveTier: l.effectiveTier,
            }))}
          />
        </section>
        <p className="text-sm text-muted">
          Looking for the full directory?{" "}
          <Link href="/directory" className="font-semibold text-turqdk underline">
            Browse all categories
          </Link>
          .
        </p>
      </div>
    </>
  );
}
