"use client";

import { useEffect } from "react";
import Link from "next/link";
import { track } from "@/lib/gtag";
import type { CommunityEvent } from "@/lib/events";
import { MASS_COPY, bi, needsOrganizerConfirm } from "@/lib/mass";

export function MassList({ events }: { events: CommunityEvent[] }) {
  useEffect(() => {
    track("mass_finder_view", { result_count: events.length });
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="rounded-2xl bg-sand/50 p-8 text-center" data-testid="mass-empty">
        <p className="text-lg font-bold text-ink">{MASS_COPY.empty.en}</p>
        <p className="mt-1 text-muted">{MASS_COPY.empty.tl}</p>
        <Link href="/events#submit-event" className="btn mt-4 inline-block">
          Submit an event · Magsumite ng kaganapan
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {events.map((e) => (
        <li key={e.id} className="rounded-2xl bg-white p-5 shadow-sm" data-testid="mass-event" data-event={e.id}>
          <h3 className="text-lg font-bold text-ink">
            <Link
              href={`/events/${e.slug}`}
              className="hover:underline"
              onClick={() => track("mass_event_click", { event_id: e.id, event_slug: e.slug })}
            >
              {e.title}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-muted">
            {new Date(e.start).toLocaleString("en-CA", {
              timeZone: e.timezone,
              dateStyle: "medium",
              timeStyle: "short",
            })}
            {" · "}
            {e.city}
            {" · "}
            {e.venue}
          </p>
          {needsOrganizerConfirm(e) ? (
            <p className="mt-2 text-sm font-semibold text-coral-dk" data-testid="expected-badge">
              {bi(MASS_COPY.expected)}
            </p>
          ) : null}
          {e.sourceUrl ? (
            <p className="mt-2 text-sm" data-testid="mass-source">
              {MASS_COPY.source.en}:{" "}
              <a
                className="font-semibold text-turqdk underline"
                href={e.sourceUrl}
                rel="noopener noreferrer"
                target="_blank"
              >
                {e.sourceUrl}
              </a>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
