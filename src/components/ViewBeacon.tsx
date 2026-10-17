"use client";
import { useEffect } from "react";

/** Counts one listing page view (server-side aggregate, no cookies, no personal data). */
export function ViewBeacon({ id }: { id: string }) {
  useEffect(() => {
    const body = JSON.stringify({ id, event: "view" });
    if (!navigator.sendBeacon?.("/api/stat", new Blob([body], { type: "text/plain" })))
      void fetch("/api/stat", { method: "POST", body, keepalive: true });
  }, [id]);
  return null;
}
