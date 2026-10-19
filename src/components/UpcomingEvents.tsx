import Link from "next/link";
import { EVENT_CATEGORIES, type EventCategory, upcomingEvents } from "@/lib/guide";

/** "Upcoming events" strip (home, sub-category pages, magazine). Evaluated at build time for static pages. */
export function UpcomingEvents({
  title = "Upcoming events",
  sub,
  limit = 3,
}: {
  title?: string;
  sub?: string;
  limit?: number;
}) {
  const list = upcomingEvents({ sub, limit });
  if (!list.length) return null;
  const id = `up-${sub ?? "all"}`;
  return (
    <section aria-labelledby={id} data-testid="upcoming-events">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 id={id} className="text-2xl font-bold text-ink">
          {title}
        </h2>
        <Link href="/calendar" className="text-sm font-semibold text-turqdk underline">
          Full calendar
        </Link>
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {list.map((e) => {
          const d = new Date(`${e.date}T12:00:00Z`);
          return (
            <li key={e.id} data-event={e.id} data-event-tier={e.tier}>
              <Link
                href={`/calendar/${e.id}`}
                className={`card group flex h-full gap-3 p-4 hover:shadow-md ${e.tier === "featured" ? "border-l-4 border-l-phred" : ""}`}
              >
                <span className="grid h-14 w-12 shrink-0 place-items-center rounded-lg bg-aqua text-center leading-none">
                  <span className="text-[11px] font-bold text-phred uppercase">
                    {d.toLocaleDateString("en-CA", { month: "short", timeZone: "UTC" })}
                  </span>
                  <span className="text-xl font-extrabold text-ink">{d.getUTCDate()}</span>
                </span>
                <span className="min-w-0">
                  <strong className="block leading-snug text-ink group-hover:text-sea">{e.name}</strong>
                  <span className="text-xs text-muted">
                    {e.city} · {EVENT_CATEGORIES[(e.category ?? "community") as EventCategory]}
                    {e.tier === "featured" ? " · Featured" : ""}
                    {e.sample ? " · SAMPLE" : ""}
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
