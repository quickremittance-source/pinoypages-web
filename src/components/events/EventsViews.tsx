import Link from "next/link";
import {
  EVENT_CATEGORIES,
  EVENTS_COPY,
  bi,
  categoryLabel,
  eventsHref,
  eventsInMonth,
  formatEventWhen,
  monthGrid,
  monthKeyOfEvent,
  needsOrganizerConfirm,
  type CommunityEvent,
  type EventFilters,
} from "@/lib/events";
import { monthLabel } from "@/lib/cal";

export function EventsListView({ events }: { events: CommunityEvent[] }) {
  if (events.length === 0) {
    return (
      <div
        className="rounded-2xl border-2 border-dashed border-ink/20 bg-white p-8 text-center"
        data-testid="events-empty"
      >
        <p className="text-lg font-bold text-ink">{EVENTS_COPY.empty.en}</p>
        <p className="mt-1 text-muted">{EVENTS_COPY.empty.tl}</p>
        <a href="#submit-event" className="btn mt-4 inline-block">
          {bi(EVENTS_COPY.submit)}
        </a>
      </div>
    );
  }
  const months = [...new Set(events.map(monthKeyOfEvent))].sort();
  return (
    <div className="space-y-8">
      {months.map((m) => (
        <section key={m} aria-labelledby={`m-${m}`}>
          <h2 id={`m-${m}`} className="text-xl font-bold text-ink">
            {monthLabel(m)}
          </h2>
          <ul className="mt-3 divide-y divide-sand rounded-2xl border border-sand bg-white">
            {eventsInMonth(events, m).map((e) => {
              const when = formatEventWhen(e);
              return (
                <li key={e.id} className="p-4 sm:flex sm:items-start sm:justify-between sm:gap-4">
                  <div>
                    <p className="text-sm text-muted">
                      <strong className="text-ink">{when.date}</strong> · {when.time} · {e.city}
                    </p>
                    <h3 className="mt-1 text-lg font-bold text-ink">
                      <Link href={`/events/${e.slug}`} className="hover:underline">
                        {e.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-muted">
                      {e.venue}
                      {e.address ? ` · ${e.address}` : ""} · {categoryLabel(e.category)}
                    </p>
                    {needsOrganizerConfirm(e) && (
                      <span className="mt-2 inline-block rounded bg-sand px-2 py-0.5 text-xs font-bold text-ink">
                        Expected, confirm with organizer
                      </span>
                    )}
                  </div>
                  <Link href={`/events/${e.slug}`} className="btn btn-ghost mt-3 px-3 py-2 text-sm sm:mt-0">
                    Details
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

export function EventsMonthView({ events, filters }: { events: CommunityEvent[]; filters: EventFilters }) {
  const grid = monthGrid(filters.month);
  const byDay = new Map<string, CommunityEvent[]>();
  for (const e of eventsInMonth(events, filters.month)) {
    const day = e.start.slice(0, 10);
    const list = byDay.get(day) ?? [];
    list.push(e);
    byDay.set(day, list);
  }
  const [y, mo] = filters.month.split("-").map(Number) as [number, number];
  const prev = new Date(Date.UTC(y, mo - 2, 1));
  const next = new Date(Date.UTC(y, mo, 1));
  const prevKey = `${prev.getUTCFullYear()}-${String(prev.getUTCMonth() + 1).padStart(2, "0")}`;
  const nextKey = `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`;
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={eventsHref({ ...filters, view: "month", month: prevKey })}
          className="btn btn-ghost px-3 py-2 text-sm"
        >
          ← Prev
        </Link>
        <h2 className="text-xl font-bold text-ink">{monthLabel(filters.month)}</h2>
        <Link
          href={eventsHref({ ...filters, view: "month", month: nextKey })}
          className="btn btn-ghost px-3 py-2 text-sm"
        >
          Next →
        </Link>
      </div>
      <div className="overflow-x-auto rounded-2xl border border-sand bg-white">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="bg-aqua/40 text-left">
              {weekdays.map((d) => (
                <th key={d} className="border-b border-sand p-2 font-semibold">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.map((week, i) => (
              <tr key={i}>
                {week.map((day, j) => {
                  const dayEvents = day ? (byDay.get(day) ?? []) : [];
                  return (
                    <td key={j} className="align-top border-b border-sand p-2 h-24">
                      {day && <div className="text-xs font-bold text-muted">{Number(day.slice(8))}</div>}
                      <ul className="mt-1 space-y-1">
                        {dayEvents.map((e) => (
                          <li key={e.id}>
                            <Link
                              href={`/events/${e.slug}`}
                              className="block truncate rounded bg-aqua px-1 py-0.5 text-xs font-semibold text-sea hover:underline"
                              title={`${e.title} · ${EVENT_CATEGORIES[e.category].en}`}
                            >
                              {e.title}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {eventsInMonth(events, filters.month).length === 0 && (
        <p className="text-center text-muted" data-testid="events-empty-month">
          {bi(EVENTS_COPY.empty)}
        </p>
      )}
    </div>
  );
}
