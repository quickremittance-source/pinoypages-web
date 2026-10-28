import type { Metadata } from "next";
import Link from "next/link";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { LogoTile, VerifiedKabayan } from "@/components/Badge";
import { PageHead } from "@/components/Chrome";
import { EventPoster } from "@/components/EventPoster";
import { ViewBeacon } from "@/components/ViewBeacon";
import { abs, EVENT_CATEGORIES, eventHost, eventMapUrl, events, isPaid, type EventCategory } from "@/lib/guide";
import { dayLabel } from "@/lib/cal";

export const dynamicParams = false;
export function generateStaticParams() {
  return events.map((e) => ({ id: e.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  return { title: events.find((e) => e.id === id)?.name, alternates: { canonical: `/calendar/${id}` } };
}

/** Every event has a page with an .ics file, address/map and host. Featured events add an image, QR and Register. */
export default async function Page({ params }: P) {
  const { id } = await params;
  const e = events.find((x) => x.id === id);
  if (!e) notFound();
  const featured = e.tier === "featured";
  const host = eventHost(e);
  const hostVerified = !!host && isPaid(host);
  const svg = featured
    ? await QRCode.toString(abs(`/e/${e.id}`), { type: "svg", margin: 2, color: { dark: "#0A5F67" } })
    : "";
  const cat = EVENT_CATEGORIES[(e.category ?? "community") as EventCategory];
  return (
    <>
      {featured && <ViewBeacon id={e.id} />}
      <PageHead
        kicker={`${featured ? "Featured event" : e.kind === "deadline" ? "CRA deadline" : "Event"} · ${cat}${e.sample ? " · SAMPLE" : ""}`}
        title={e.name}
      >
        <nav aria-label="Breadcrumb" className="mt-3 text-sm">
          <Link href="/calendar" className="text-turqdk underline">
            Calendar
          </Link>{" "}
          / <span aria-current="page">{dayLabel(e.date)}</span>
        </nav>
      </PageHead>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_320px]" data-event-page={e.tier}>
        <div className="space-y-6">
          {featured && <EventPoster e={e} className="card w-full overflow-hidden" />}
          <section className="card p-6" aria-labelledby="when">
            <h2 id="when" className="sr-only">
              When and where
            </h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold text-muted">When</dt>
                <dd className="font-semibold">
                  {dayLabel(e.date)}
                  {e.time && <span className="block font-normal">{e.time}</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Where</dt>
                <dd className="font-semibold" data-testid="event-address">
                  {e.venue ?? e.place}
                  {e.address && <span className="block font-normal">{e.address}</span>}
                  {e.city && <span className="block font-normal">{e.city}, ON</span>}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Host</dt>
                <dd className="font-semibold">
                  {e.organizer} <span className="font-normal text-muted">· {e.contact}</span>
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold text-muted">Cost</dt>
                <dd className="font-semibold">
                  {e.kind === "deadline" ? "Official deadline" : "See host for details"}
                </dd>
              </div>
            </dl>
            {featured && e.description && <p className="mt-5 text-lg leading-relaxed">{e.description}</p>}
            {!featured && e.description && <p className="mt-5">{e.description}</p>}
            <div className="mt-5 flex flex-wrap gap-2">
              <a className="btn btn-teal" href={`/ics/${e.id}.ics`} download>
                Add to calendar (.ics)
              </a>
              {e.kind !== "deadline" && (
                <a className="btn btn-ghost" href={eventMapUrl(e)} rel="noopener">
                  Open map
                </a>
              )}
              {featured && (
                <a className="btn" href={`/e/${e.id}`}>
                  Register
                </a>
              )}
              {e.source && (
                <a className="btn btn-ghost" href={e.source} rel="noopener">
                  Source: CRA
                </a>
              )}
            </div>
          </section>
          {e.kind !== "deadline" && (
            <section className="card pinstripe-bg grid place-items-center p-6 text-center" aria-label="Map">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-10 w-10 text-phred" fill="currentColor">
                <path d="M12 2a7 7 0 00-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 00-7-7zm0 9.5A2.5 2.5 0 1112 6a2.5 2.5 0 010 5.5z" />
              </svg>
              <p className="mt-2 font-semibold">{[e.address, e.city].filter(Boolean).join(", ")}</p>
              <a className="mt-1 text-sm font-semibold text-turqdk underline" href={eventMapUrl(e)} rel="noopener">
                Directions in Google Maps
              </a>
              {e.sample && <p className="mt-1 text-xs text-muted">SAMPLE address for the prototype.</p>}
            </section>
          )}
        </div>
        <aside className="space-y-4" aria-label="Host">
          {host && (
            <section className="card p-5" data-testid="event-host">
              <p className="kicker">Host</p>
              <div className="mt-2 flex items-center gap-3">
                <LogoTile l={host} size="sm" />
                <div>
                  {hostVerified ? (
                    <Link href={`/listing/${host.id}`} className="font-bold text-ink underline">
                      {host.name}
                    </Link>
                  ) : (
                    <span className="font-bold">{host.name}</span>
                  )}
                  <div className="mt-1">
                    <VerifiedKabayan l={host} />
                  </div>
                </div>
              </div>
              {!hostVerified && <p className="mt-2 text-xs text-muted">Free listing · unverified.</p>}
            </section>
          )}
          {featured && (
            <section className="card p-5 text-center">
              <div
                role="img"
                aria-label={`QR code to register for ${e.name}`}
                className="mx-auto w-40"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
              <p className="mt-2 text-xs text-muted">Scan to register.</p>
            </section>
          )}
          <section className="card p-5 text-sm">
            <p className="font-bold text-ink">Hosting an event?</p>
            <p className="mt-1 text-muted">
              Free listings are text only. Featured events: rates on request, free for Verified members.
            </p>
            <Link href="/calendar#evform" className="mt-2 inline-block font-semibold text-turqdk underline">
              Submit your event
            </Link>
          </section>
        </aside>
      </div>
    </>
  );
}
