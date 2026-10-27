"use client";

import { useEffect } from "react";
import { track } from "@/lib/gtag";

/** Fires event_view once on the detail page. No-op without GA ID (gtag.track handles that). */
export function EventViewBeacon({ eventId, slug }: { eventId: string; slug: string }) {
  useEffect(() => {
    track("event_view", { event_id: eventId, event_slug: slug });
  }, [eventId, slug]);
  return null;
}

export function TrackedLink({
  href,
  eventName,
  eventId,
  slug,
  className,
  children,
  download,
}: {
  href: string;
  eventName: "event_click_ticket" | "add_to_calendar";
  eventId: string;
  slug: string;
  className?: string;
  children: React.ReactNode;
  download?: boolean;
}) {
  return (
    <a
      href={href}
      className={className}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      download={download || undefined}
      onClick={() => track(eventName, { event_id: eventId, event_slug: slug })}
    >
      {children}
    </a>
  );
}
