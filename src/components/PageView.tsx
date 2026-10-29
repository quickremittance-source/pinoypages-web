"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** First-party, cookie-free page-view beacon (see /api/pv). Skips private areas. */
export function PageView() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => {
    if (!path || /^\/(admin|stats|results)(\/|$)/.test(path)) return;
    const r = first.current ? document.referrer : location.origin;
    first.current = false;
    const body = JSON.stringify({ p: path, r });
    try {
      if (!navigator.sendBeacon?.("/api/pv", new Blob([body], { type: "application/json" })))
        void fetch("/api/pv", { method: "POST", body, keepalive: true });
    } catch {
      /* ignore */
    }
  }, [path]);
  return null;
}
