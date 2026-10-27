import Link from "next/link";
import {
  DISH_TAGS,
  FOOD_COPY,
  FOOD_TYPES,
  bi,
  type FoodFilters,
  type FoodType,
} from "@/lib/food";

export function FoodFilterForm({
  filters,
  cities,
  anyHours,
  resultCount,
}: {
  filters: FoodFilters;
  cities: string[];
  anyHours: boolean;
  resultCount: number;
}) {
  const sel = "field mt-1 py-2";
  const active = !!(filters.city || filters.type || filters.dish || filters.open);
  return (
    <form
      key={`${filters.city}|${filters.type}|${filters.dish}|${filters.open}`}
      role="search"
      aria-label={bi(FOOD_COPY.kicker)}
      action="/food"
      method="get"
      className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end"
      data-testid="food-filters"
    >
      <label className="block text-sm font-semibold">
        {bi(FOOD_COPY.city)}
        <select className={sel} name="city" defaultValue={filters.city}>
          <option value="">All</option>
          {cities.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        {bi(FOOD_COPY.type)}
        <select className={sel} name="type" defaultValue={filters.type}>
          <option value="">All</option>
          {(Object.keys(FOOD_TYPES) as FoodType[]).map((k) => (
            <option key={k} value={k}>
              {FOOD_TYPES[k].en} · {FOOD_TYPES[k].tl}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        {bi(FOOD_COPY.dish)}
        <select className={sel} name="dish" defaultValue={filters.dish} data-testid="food-dish-filter">
          <option value="">All</option>
          {DISH_TAGS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </label>
      <div className="col-span-2 flex flex-wrap items-center gap-3 lg:col-span-1">
        {anyHours ? (
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="open" value="1" defaultChecked={filters.open} />
            {bi(FOOD_COPY.openNow)}
          </label>
        ) : null}
        <button type="submit" className="btn px-4 py-2 text-sm">
          Filter
        </button>
        {active ? (
          <Link href="/food" className="btn btn-ghost px-3 py-2 text-sm">
            Clear
          </Link>
        ) : null}
      </div>
      <p
        role="status"
        aria-live="polite"
        className="col-span-2 text-sm text-muted lg:col-span-4"
        data-testid="food-count"
      >
        {resultCount === 0
          ? bi(FOOD_COPY.empty)
          : `${resultCount} place${resultCount === 1 ? "" : "s"}`}
      </p>
    </form>
  );
}
