"use client";
import { useEffect } from "react";
import { track as gtagTrack } from "@/lib/gtag";

function send(id: string, event: string) {
  const body = JSON.stringify({ id, event });
  if (!navigator.sendBeacon?.("/api/stat", new Blob([body], { type: "text/plain" })))
    void fetch("/api/stat", { method: "POST", body, keepalive: true });
}

/** Counts a view on every load, plus a scan when opened from the printed QR (?src=qr). No personal data. */
export function AdBeacon({ id }: { id: string }) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const fromQr = q.get("src") === "qr";
    const t = q.get("t");
    send(id, "view");
    if (fromQr) send(id, "scan");
    // Per-print scan count, keyed by the ad's tracking id (server rejects unknown ids).
    if (fromQr && t && /^[a-z0-9]{4,12}$/.test(t)) send(`${id}:${t}`, "scan");
    gtagTrack("ad_landing_view", { ad_id: id, source: fromQr ? "qr" : "web", tracking_id: t ?? undefined });
  }, [id]);
  return null;
}

/** Link that counts a click (call, map, website, tap) before navigating. */
export function AdLink({
  id,
  event,
  className,
  href,
  children,
  download,
}: {
  id: string;
  event: "call" | "map" | "website" | "tap";
  className?: string;
  href: string;
  children: React.ReactNode;
  download?: boolean;
}) {
  const ext = /^https?:/.test(href);
  return (
    <a
      href={href}
      className={className}
      download={download || undefined}
      target={ext ? "_blank" : undefined}
      rel={ext ? "noopener noreferrer" : undefined}
      onClick={() => {
        send(id, event);
        gtagTrack("ad_landing_click", { ad_id: id, action: event });
      }}
    >
      {children}
    </a>
  );
}
