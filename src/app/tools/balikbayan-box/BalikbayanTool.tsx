"use client";

import { useEffect } from "react";
import { track } from "@/lib/gtag";
import { BALIKBAYAN_CARRIERS, BALIKBAYAN_COPY, DTI_ACCREDITED_LIST, bi } from "@/lib/balikbayan";

export function BalikbayanTool() {
  useEffect(() => {
    track("balikbayan_view", {});
  }, []);

  return (
    <div className="space-y-8">
      <p className="rounded-2xl bg-sand/60 p-4 text-sm font-semibold text-ink" data-testid="no-estimator-notice">
        {bi({
          en: "Price estimator unavailable — carriers do not publish a stable public price list we can fetch. Use the directory below and ask each carrier for today's quote.",
          tl: "Walang tanantya ng presyo — walang matatag na pampublikong listahan ng rate. Gamitin ang direktoryo at humingi ng quote sa bawat carrier.",
        })}
      </p>

      <ul className="grid gap-4 sm:grid-cols-2">
        {BALIKBAYAN_CARRIERS.map((c) => (
          <li
            key={c.id}
            className="rounded-2xl bg-white p-5 shadow-sm"
            data-testid="balikbayan-carrier"
            data-carrier={c.id}
          >
            <h3 className="text-lg font-bold text-ink">{c.name}</h3>
            <p className="mt-1 text-sm text-muted">{c.region}</p>
            <p className="mt-2 text-sm font-semibold text-coral-dk">{bi(BALIKBAYAN_COPY.checkProvider)}</p>
            <p className="mt-1 text-sm text-muted">{c.notes.en}</p>
            <p className="mt-1 text-sm text-muted">{c.notes.tl}</p>
            <a
              className="btn mt-4 inline-block px-4 py-2 text-sm"
              href={c.url}
              rel="noopener noreferrer"
              target="_blank"
              onClick={() => track("balikbayan_carrier_click", { carrier_id: c.id })}
            >
              {bi(BALIKBAYAN_COPY.openCarrier)}
            </a>
          </li>
        ))}
      </ul>

      <section aria-labelledby="dti-heading" className="rounded-2xl border border-sand bg-white p-5">
        <h2 id="dti-heading" className="text-lg font-bold text-ink">
          {bi(BALIKBAYAN_COPY.accredited)}
        </h2>
        <p className="mt-2 text-sm text-muted">{DTI_ACCREDITED_LIST.notes.en}</p>
        <p className="mt-1 text-sm text-muted">{DTI_ACCREDITED_LIST.notes.tl}</p>
        <p className="mt-3 text-sm">
          <a
            className="font-semibold text-turqdk underline"
            href={DTI_ACCREDITED_LIST.url}
            rel="noopener noreferrer"
            target="_blank"
            data-testid="dti-list-link"
          >
            {DTI_ACCREDITED_LIST.name}
          </a>
          {" · "}list as of {DTI_ACCREDITED_LIST.asOf}
        </p>
      </section>

      <p className="text-sm text-muted" data-testid="empty-listings-note">
        {bi(BALIKBAYAN_COPY.emptyListings)}
      </p>

      <aside
        className="rounded-2xl border border-sand bg-white p-5 text-sm text-muted"
        data-testid="balikbayan-disclaimer"
      >
        <p>{BALIKBAYAN_COPY.disclaimer.en}</p>
        <p className="mt-2">{BALIKBAYAN_COPY.disclaimer.tl}</p>
      </aside>
    </div>
  );
}
