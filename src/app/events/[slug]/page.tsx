import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/JsonLd";
import { PageHead } from "@/components/Chrome";
import { EventViewBeacon, TrackedLink } from "@/components/events/EventActions";
import {
  EVENTS_COPY,
  approvedEvents,
  bi,
  categoryLabel,
  eventBySlug,
  eventJsonLd,
  formatEventWhen,
  googleCalendarUrl,
  listingForEvent,
  listingHref,
  mapsUrl,
  needsOrganizerConfirm,
} from "@/lib/events";
import { bizPath } from "@/lib/seo";

export function generateStaticParams() {
  return approvedEvents().map((e) => ({ slug: e.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const e = eventBySlug((await params).slug);
  if (!e) return { title: "Event not found" };
  return {
    title: e.title,
    description: e.description ?? `${e.title} · ${e.venue} · ${e.city}`,
    alternates: { canonical: `/events/${e.slug}` },
  };
}

export default async function EventDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const e = eventBySlug((await params).slug);
  if (!e) notFound();
  const when = formatEventWhen(e);
  const listing = listingForEvent(e);
  const listingUrl = listingHref(e);

  return (
    <>
      <JsonLd data={eventJsonLd(e)} />
      <EventViewBeacon eventId={e.id} slug={e.slug} />
      <PageHead kicker={bi(EVENTS_COPY.kicker)} title={e.title} intro={`${when.date} · ${when.time} (${e.timezone})`}>
        <p className="mt-2 text-sm text-muted">
          {e.city} · {categoryLabel(e.category)}
        </p>
        {needsOrganizerConfirm(e) && (
          <p
            data-testid="expected-badge"
            className="mt-3 inline-block rounded-md bg-sand px-2.5 py-1 text-xs font-bold text-ink"
          >
            Expected, confirm with organizer
          </p>
        )}
      </PageHead>
      <article className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <div className="card space-y-3 p-6">
          <p>
            <strong>Venue · Lugar:</strong> {e.venue}
          </p>
          {e.address && (
            <p>
              <strong>Address · Tirahan:</strong> {e.address}
            </p>
          )}
          {e.description && <p className="text-muted whitespace-pre-wrap">{e.description}</p>}
          {e.sourceUrl && (
            <p data-testid="event-source">
              <strong>Source:</strong>{" "}
              <a
                href={e.sourceUrl}
                className="text-turqdk underline break-all"
                rel="noopener noreferrer"
                target="_blank"
              >
                {e.sourceUrl}
              </a>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <TrackedLink
            href={`/events/ics/${e.slug}`}
            eventName="add_to_calendar"
            eventId={e.id}
            slug={e.slug}
            className="btn px-4 py-2 text-sm"
            download
          >
            {bi(EVENTS_COPY.addToCalendar)} (.ics)
          </TrackedLink>
          <TrackedLink
            href={googleCalendarUrl(e)}
            eventName="add_to_calendar"
            eventId={e.id}
            slug={e.slug}
            className="btn btn-ghost px-4 py-2 text-sm"
          >
            {EVENTS_COPY.googleCal.en}
          </TrackedLink>
          <a href={mapsUrl(e)} className="btn btn-ghost px-4 py-2 text-sm" rel="noopener noreferrer" target="_blank">
            {bi(EVENTS_COPY.map)}
          </a>
          {e.ticketUrl && (
            <TrackedLink
              href={e.ticketUrl}
              eventName="event_click_ticket"
              eventId={e.id}
              slug={e.slug}
              className="btn px-4 py-2 text-sm"
            >
              {bi(EVENTS_COPY.tickets)}
            </TrackedLink>
          )}
          {listing && listingUrl && (
            <Link href={bizPath(listing)} className="btn btn-ghost px-4 py-2 text-sm">
              {bi(EVENTS_COPY.listing)}: {listing.name}
            </Link>
          )}
        </div>
        <p>
          <Link href="/events" className="text-turqdk underline">
            ← {bi(EVENTS_COPY.kicker)}
          </Link>
        </p>
      </article>
    </>
  );
}
