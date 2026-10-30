import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { CalendarControls } from "@/components/CalendarControls";
import { EventPoster } from "@/components/EventPoster";
import { EventForm } from "@/components/Forms";
import {
  adsForRoute,
  ads,
  brand,
  EVENT_CATEGORIES,
  eventMenu,
  events,
  isPaid,
  listings,
  money,
  seasons,
  type CalEvent,
  type EventCategory,
} from "@/lib/guide";
import { byMonthFeaturedFirst, dayLabel, monthGrid, monthKeyOf, monthLabel } from "@/lib/cal";

export const metadata: Metadata = { title: "Money & Business Calendar", alternates: { canonical: "/calendar" } };

const seasonOf = (d: string) => seasons.find((s) => s.months.includes(Number(d.slice(5, 7))))?.id ?? "fall";
const catOf = (e: CalEvent) => (e.category ?? "community") as EventCategory;
const attrs = (e: CalEvent) => ({
  "data-ev": e.id,
  "data-cat": catOf(e),
  "data-city": e.city ?? "",
  "data-event-tier": e.tier,
  "data-kind": e.kind,
});

function ListItem({ e }: { e: CalEvent }) {
  if (e.tier === "featured")
    return (
      <li {...attrs(e)} className="card grid overflow-hidden border-2 border-phred sm:grid-cols-[220px_1fr]">
        <EventPoster e={e} className="h-full w-full" />
        <div className="p-4">
          <p className="kicker">Featured event{e.sample ? " · Sample" : ""}</p>
          <h3 className="mt-1 text-lg font-bold text-ink">
            <Link href={`/calendar/${e.id}`} className="hover:underline">
              {e.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm">
            <strong>{dayLabel(e.date)}</strong> · {e.time} · {e.place}
          </p>
          <p className="text-sm text-muted">
            Hosted by {e.organizer} · {e.contact}
          </p>
          {e.description && <p className="mt-2 text-sm">{e.description}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            <a className="btn px-4 py-2 text-sm" href={`/e/${e.id}`}>
              Register
            </a>
            <Link className="btn btn-ghost px-4 py-2 text-sm" href={`/calendar/${e.id}`}>
              Details
            </Link>
          </div>
        </div>
      </li>
    );
  // Free basic: text only (no image, no button). Deadlines carry their CRA source.
  return (
    <li {...attrs(e)} className="border-b border-sand py-2.5 text-sm">
      <strong>{dayLabel(e.date)}</strong> ·{" "}
      {e.kind === "deadline" ? (
        e.name
      ) : (
        <Link href={`/calendar/${e.id}`} className="font-semibold text-ink hover:underline">
          {e.name}
        </Link>
      )}
      {e.time && ` · ${e.time}`} · {e.place} · {e.organizer}
      {e.kind !== "deadline" && ` (${e.contact})`}
      {e.sample && " · SAMPLE"}
      {e.source && (
        <a className="ml-1 underline" href={e.source} rel="noopener">
          Source: CRA
        </a>
      )}
    </li>
  );
}

export default function Page() {
  const sponsor = ads.find((a) => a.id === "slot-cal");
  const presented = sponsor?.status === "sold" ? sponsor.advertiser : "";
  const sorted = events.slice().sort(byMonthFeaturedFirst);
  const months = [...new Set(sorted.map((e) => monthKeyOf(e.date)))].sort();
  const firstUpcoming =
    months.find((m) => sorted.some((e) => e.kind === "community" && monthKeyOf(e.date) === m)) ?? months[0]!;
  const cats = (Object.keys(EVENT_CATEGORIES) as EventCategory[])
    .filter((c) => events.some((e) => catOf(e) === c))
    .map((c) => ({ value: c, label: EVENT_CATEGORIES[c] }));
  const cities = [...new Set(events.map((e) => e.city ?? "").filter(Boolean))].sort();
  return (
    <>
      <PageHead
        kicker={presented ? `Presented by ${presented}` : "Calendar"}
        page={11}
        title="Money & Business Calendar"
        intro={`${brand.seasons}: official tax deadlines plus community money and business events in the GTA. Featured events: rates on request, free for Verified members.`}
      >
        <a href="#evform" className="btn mt-4">
          Submit your event
        </a>
      </PageHead>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
        {!events.some((e) => e.kind === "community") && (
          <p data-testid="no-community-events" className="card p-4 text-ink">
            No community events are listed yet. Hosting one in the GTA?{" "}
            <a href="#evform" className="font-semibold text-turqdk underline">
              Submit your event
            </a>
            .
          </p>
        )}
        <CalendarControls
          target="cal"
          months={months.map((m) => ({ value: m, label: monthLabel(m) }))}
          initialMonth={firstUpcoming}
          cats={cats}
          cities={cities}
        />
        <div id="cal" data-view="list" className="group/cal">
          <div data-list className="space-y-8 group-data-[view=month]/cal:hidden">
            {months.map((m) => (
              <section key={m} data-month-group={m} data-season={seasonOf(`${m}-01`)} aria-labelledby={`m-${m}`}>
                <h2 id={`m-${m}`} className="mb-3 text-xl font-bold text-ink">
                  {monthLabel(m)}
                </h2>
                <ol className="space-y-3">
                  {sorted
                    .filter((e) => monthKeyOf(e.date) === m)
                    .map((e) => (
                      <ListItem key={e.id} e={e} />
                    ))}
                </ol>
              </section>
            ))}
          </div>
          <div className="hidden group-data-[view=month]/cal:block" data-testid="month-view">
            {months.map((m) => (
              <section key={m} data-month-grid={m} hidden={m !== firstUpcoming} aria-label={monthLabel(m)}>
                <table className="card w-full table-fixed border-collapse text-xs">
                  <caption className="p-2 text-left text-lg font-bold text-ink">{monthLabel(m)}</caption>
                  <thead>
                    <tr className="text-muted">
                      {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                        <th key={d} scope="col" className="p-1 font-semibold">
                          {d}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {monthGrid(m).map((w, wi) => (
                      <tr key={wi}>
                        {w.map((d, di) => {
                          const day = d ? sorted.filter((e) => e.date === d) : [];
                          return (
                            <td key={di} className={`h-20 border border-sand p-1 align-top ${d ? "" : "bg-sand/40"}`}>
                              {d && <span className="font-semibold text-muted">{Number(d.slice(8))}</span>}
                              <ul className="mt-0.5 space-y-0.5">
                                {day.map((e) => (
                                  <li key={e.id} {...attrs(e)} data-kind={undefined}>
                                    <Link
                                      href={`/calendar/${e.id}`}
                                      title={e.name}
                                      className={`block truncate rounded px-1 py-0.5 font-semibold ${
                                        e.tier === "featured"
                                          ? "bg-phred text-white"
                                          : e.kind === "deadline"
                                            ? "bg-sand text-ink"
                                            : "bg-aqua text-sea"
                                      }`}
                                    >
                                      {e.name}
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
              </section>
            ))}
            <p className="mt-2 text-xs text-muted">
              <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-phred align-middle" /> Featured ·{" "}
              <span className="mx-1 inline-block h-2.5 w-2.5 rounded-sm bg-aqua align-middle" /> Free ·{" "}
              <span className="mx-1 inline-block h-2.5 w-2.5 rounded-sm bg-sand align-middle" /> CRA deadline
            </p>
          </div>
        </div>
        <p className="text-sm text-muted">{brand.eventNote}</p>

        <section aria-labelledby="print" className="card p-5" data-print-mirror>
          <h2 id="print" className="text-xl font-bold text-ink">
            Print page 11 · as it appears in the edition
          </h2>
          <div className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
            {seasons.map((s) => (
              <div key={s.id}>
                <h3 className="font-bold text-phred">{s.name}</h3>
                <ul className="mt-1 space-y-1">
                  {events
                    .filter((e) => s.months.includes(Number(e.date.slice(5, 7))))
                    .map((e) => (
                      <li key={e.id}>
                        {e.tier === "featured" && <strong>★ </strong>}
                        {e.date.slice(5)} · {e.name}
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="evmenu" className="grid gap-4 md:grid-cols-2">
          <h2 id="evmenu" className="sr-only">
            List your event
          </h2>
          {eventMenu.map((o) => (
            <div
              key={o.id}
              className={`card p-5 ${o.price || ("onRequest" in o && o.onRequest) ? "border-2 border-phred" : ""}`}
              data-plan={o.id}
            >
              <p className="kicker">{o.name}</p>
              <p className="mt-1 text-2xl font-extrabold text-ink">
                {"onRequest" in o && o.onRequest ? "Rates on request" : o.price ? money(o.price) : "Free"}{" "}
                <span className="text-sm font-semibold text-muted">{o.unit}</span>
              </p>
              <p className="mt-2 text-sm">{o.includes}</p>
              {o.memberNote && <p className="mt-1 text-sm font-semibold text-sea">{o.memberNote}</p>}
            </div>
          ))}
        </section>
        <section aria-labelledby="evform-h" id="evform">
          <h2 className="mb-1 text-2xl font-bold text-ink" id="evform-h">
            Submit your event
          </h2>
          <p className="mb-3 text-sm text-muted">
            Interest only: nothing is charged online. We review every event before it appears, and confirm by email.
          </p>
          <EventForm members={listings.filter(isPaid).map((l) => ({ id: l.id, name: l.name }))} />
        </section>
      </div>
      <AdGrid ads={adsForRoute("/calendar")} />
    </>
  );
}
