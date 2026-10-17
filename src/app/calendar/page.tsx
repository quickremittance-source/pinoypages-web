import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { EventForm } from "@/components/Forms";
import { adsForRoute, ads, brand, eventMenu, events, isPaid, listings, money, seasons } from "@/lib/guide";

export const metadata: Metadata = { title: "Money & Business Calendar", alternates: { canonical: "/calendar" } };

const fmt = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });

export default function Page() {
  const sponsor = ads.find((a) => a.id === "slot-cal");
  const presented = sponsor?.status === "sold" ? sponsor.advertiser : "";
  return (
    <>
      <PageHead
        kicker={presented ? `Presented by ${presented}` : "Calendar"}
        page={11}
        title="Money & Business Calendar"
        intro={`${brand.seasons}: official tax deadlines plus community money and business events in the GTA. Updated year-round.`}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        {seasons.map((season) => {
          const list = events.filter((e) => season.months.includes(Number(e.date.slice(5, 7))));
          return (
            <section key={season.id} aria-labelledby={`s-${season.id}`} data-season={season.id}>
              <h2 id={`s-${season.id}`} className="mb-3 text-2xl font-semibold text-sea">
                {season.name}
              </h2>
              <ol className="space-y-3">
                {list.map((e) =>
                  e.tier === "featured" ? (
                    <li key={e.id} data-event-tier="featured" className="rounded-xl border-2 border-sunset bg-sand p-4">
                      <p className="kicker">★ Featured event{e.sample ? " · sample" : ""}</p>
                      <h3 className="text-lg font-semibold text-sea">
                        <Link href={`/calendar/${e.id}`}>{e.name}</Link>
                      </h3>
                      <p>
                        {fmt(e.date)} {e.time && `· ${e.time}`} · {e.place} · {e.organizer} · {e.contact}
                      </p>
                      {e.description && <p className="mt-1 text-sm">{e.description}</p>}
                      <a className="btn mt-2 text-sm" href={`/e/${e.id}`}>
                        Register
                      </a>
                    </li>
                  ) : (
                    <li key={e.id} data-event-tier="free" data-kind={e.kind} className="rounded-xl bg-white p-3">
                      <strong className="text-sea">{fmt(e.date)}</strong> · {e.name}
                      {e.time && ` · ${e.time}`} · {e.place} · {e.organizer} ({e.contact})
                      {e.source && (
                        <a className="ml-1 text-sm underline" href={e.source} rel="noopener">
                          Source: CRA
                        </a>
                      )}
                    </li>
                  ),
                )}
              </ol>
            </section>
          );
        })}
        <p className="text-sm">{brand.eventNote}</p>
        <section aria-labelledby="evmenu" className="rounded-2xl bg-aqua p-4">
          <h2 id="evmenu" className="text-xl font-semibold text-sea">
            List your event
          </h2>
          <ul className="mt-2 space-y-1">
            {eventMenu.map((o) => (
              <li key={o.id}>
                <strong>{o.name}</strong>: {o.price ? money(o.price) : "Free"}
                {o.founding !== o.price && ` (${money(o.founding)} founding)`} {o.unit} — {o.includes} {o.memberNote}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="evform">
          <h2 id="evform" className="mb-3 text-2xl font-semibold text-sea">
            Submit an event
          </h2>
          <EventForm members={listings.filter(isPaid).map((l) => ({ id: l.id, name: l.name }))} />
        </section>
      </div>
      <AdGrid ads={adsForRoute("/calendar")} />
    </>
  );
}
