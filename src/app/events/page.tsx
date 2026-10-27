import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { CommunityEventForm } from "@/components/events/CommunityEventForm";
import { EventsFilterForm } from "@/components/events/EventsFilterForm";
import { EventsListView, EventsMonthView } from "@/components/events/EventsViews";
import { EVENTS_COPY, approvedEvents, bi, filterEvents, parseEventFilters, sortByStart } from "@/lib/events";

export const metadata: Metadata = {
  title: "Events · Mga Kaganapan",
  description: EVENTS_COPY.intro.en,
  alternates: { canonical: "/events" },
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseEventFilters(await searchParams);
  const filtered = filterEvents(approvedEvents(), filters).slice().sort(sortByStart);

  return (
    <>
      <PageHead kicker={bi(EVENTS_COPY.kicker)} title={EVENTS_COPY.title.en} intro={EVENTS_COPY.intro.en}>
        <p className="mt-2 text-muted">{EVENTS_COPY.title.tl}</p>
        <a href="#submit-event" className="btn mt-4 inline-block">
          {bi(EVENTS_COPY.submit)}
        </a>
      </PageHead>
      <div className="mx-auto max-w-6xl space-y-10 px-4 py-8">
        <EventsFilterForm filters={filters} resultCount={filtered.length} />
        {filters.view === "month" ? (
          <EventsMonthView events={filtered} filters={filters} />
        ) : (
          <EventsListView events={filtered} />
        )}
        <section aria-labelledby="submit-heading" className="space-y-4">
          <h2 id="submit-heading" className="text-2xl font-bold text-ink">
            {bi(EVENTS_COPY.submit)}
          </h2>
          <p className="text-muted">
            Tell us about a Filipino community event. We review every submission before it appears — nothing is
            auto-published.
          </p>
          <CommunityEventForm />
        </section>
      </div>
    </>
  );
}
