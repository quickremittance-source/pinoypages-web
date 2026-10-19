"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const HIDE = [/^\/get-verified/, /^\/upgrade/, /^\/list-free/, /^\/card\//, /^\/report\//, /^\/admin/, /^\/results/];

/**
 * Small "Get Verified" bar at the bottom of the screen on mobile only. No exit-intent, no timers, no countdowns.
 * Dismissing it hides it for the rest of the visit (sessionStorage). Never shown on ZCard or sign-up pages.
 */
export function StickyCta() {
  const path = usePathname();
  const [closed, setClosed] = useState(true);
  useEffect(() => setClosed(sessionStorage.getItem("pp-cta-closed") === "1"), []);
  if (closed || HIDE.some((r) => r.test(path))) return null;
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-sand bg-white/95 px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.06)] backdrop-blur md:hidden"
      data-testid="sticky-cta"
    >
      <div className="flex items-center gap-2">
        <p className="min-w-0 flex-1 text-xs leading-tight text-muted">
          <strong className="block text-sm text-ink">Own a Filipino business?</strong>
          List free, or get Verified for $199.
        </p>
        <Link href="/get-verified" className="btn px-3 py-2 text-sm">
          Get Verified
        </Link>
        <button
          type="button"
          aria-label="Dismiss"
          className="grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-sand"
          onClick={() => {
            sessionStorage.setItem("pp-cta-closed", "1");
            setClosed(true);
          }}
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" focusable="false">
            <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      </div>
    </div>
  );
}
