import Link from "next/link";
import {
  EVENT_CATEGORIES,
  EVENT_CITIES,
  EVENTS_COPY,
  bi,
  eventsHref,
  type EventCategory,
  type EventFilters,
} from "@/lib/events";

export function EventsFilterForm({ filters, resultCount }: { filters: EventFilters; resultCount: number }) {
  const sel = "field mt-1 py-2";
  const active = !!(filters.city || filters.category || filters.view === "month");
  return (
    <form
      key={`${filters.city}|${filters.category}|${filters.view}|${filters.month}`}
      role="search"
      aria-label={bi(EVENTS_COPY.kicker)}
      action="/events"
      method="get"
      className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-[1fr_1fr_auto_auto] lg:items-end"
    >
      <input type="hidden" name="view" value={filters.view} />
      {filters.view === "month" && <input type="hidden" name="month" value={filters.month} />}
      <label className="block text-sm font-semibold">
        {bi(EVENTS_COPY.city)}
        <select className={sel} name="city" defaultValue={filters.city}>
          <option value="">All</option>
          {EVENT_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        {bi(EVENTS_COPY.category)}
        <select className={sel} name="category" defaultValue={filters.category}>
          <option value="">All</option>
          {(Object.keys(EVENT_CATEGORIES) as EventCategory[]).map((k) => (
            <option key={k} value={k}>
              {EVENT_CATEGORIES[k].en}
            </option>
          ))}
        </select>
      </label>
      <div className="col-span-2 flex flex-wrap items-center gap-2 lg:col-span-2">
        <button type="submit" className="btn px-4 py-2 text-sm">
          Filter
        </button>
        {active ? (
          <Link
            href={eventsHref({ view: filters.view, month: filters.month })}
            className="btn btn-ghost px-3 py-2 text-sm"
          >
            Clear
          </Link>
        ) : null}
        <div className="ml-auto flex gap-1" role="group" aria-label="View">
          <Link
            href={eventsHref({ ...filters, view: "list" })}
            className={`btn px-3 py-2 text-sm ${filters.view === "list" ? "" : "btn-ghost"}`}
            aria-current={filters.view === "list" ? "page" : undefined}
          >
            {bi(EVENTS_COPY.listView)}
          </Link>
          <Link
            href={eventsHref({ ...filters, view: "month" })}
            className={`btn px-3 py-2 text-sm ${filters.view === "month" ? "" : "btn-ghost"}`}
            aria-current={filters.view === "month" ? "page" : undefined}
          >
            {bi(EVENTS_COPY.monthView)}
          </Link>
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="col-span-2 text-sm text-muted lg:col-span-4"
        data-testid="events-count"
      >
        {resultCount === 0 ? bi(EVENTS_COPY.empty) : `${resultCount} event${resultCount === 1 ? "" : "s"}`}
      </p>
    </form>
  );
}
