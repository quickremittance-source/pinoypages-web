"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/gtag";
import { REMITTANCE_COPY, REMITTANCE_PROVIDERS, bi, type RemittanceProvider } from "@/lib/remittance";

type Quote = {
  rate: number;
  asOf: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
} | null;

export function RemittanceTool({ quote }: { quote: Quote }) {
  const [amount, setAmount] = useState("500");
  const cad = Number(amount);
  const ok = Number.isFinite(cad) && cad > 0;

  useEffect(() => {
    track("remittance_compare_view", { has_mid_market: quote ? 1 : 0 });
  }, [quote]);

  return (
    <div className="space-y-8">
      <label className="block font-bold">
        {bi({ en: "Amount to send (CAD)", tl: "Halagang ipapadala (CAD)" })}
        <input
          className="field mt-1"
          inputMode="decimal"
          type="number"
          min="1"
          step="1"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          data-testid="remittance-amount"
        />
      </label>

      <section aria-labelledby="mid-market-heading" className="rounded-2xl bg-aqua/40 p-5">
        <h2 id="mid-market-heading" className="text-lg font-bold text-ink">
          {bi(REMITTANCE_COPY.midMarket)}
        </h2>
        {quote ? (
          <>
            <p className="mt-2 text-2xl font-bold text-turqdk" data-testid="mid-market-rate">
              1 CAD ≈ {quote.rate.toFixed(4)} PHP
            </p>
            {ok ? (
              <p className="mt-1 text-sm text-muted" data-testid="mid-market-approx">
                Reference only (before fees): {cad.toLocaleString("en-CA")} CAD ≈{" "}
                {(cad * quote.rate).toLocaleString("en-CA", { maximumFractionDigits: 2 })} PHP
              </p>
            ) : null}
            <p className="mt-3 text-sm text-muted">
              Source:{" "}
              <a className="font-semibold text-turqdk underline" href={quote.sourceUrl} rel="noopener noreferrer">
                {quote.sourceName}
              </a>
              {" · "}as of {quote.asOf}
              {" · "}fetched {new Date(quote.fetchedAt).toISOString()}
            </p>
          </>
        ) : (
          <p className="mt-2 text-muted" data-testid="mid-market-unavailable">
            {bi(REMITTANCE_COPY.unavailable)}
          </p>
        )}
      </section>

      <ul className="grid gap-4 sm:grid-cols-2">
        {REMITTANCE_PROVIDERS.map((p) => (
          <ProviderCard key={p.id} provider={p} />
        ))}
      </ul>

      <aside
        className="rounded-2xl border border-sand bg-white p-5 text-sm text-muted"
        data-testid="remittance-disclaimer"
      >
        <p>{REMITTANCE_COPY.disclaimer.en}</p>
        <p className="mt-2">{REMITTANCE_COPY.disclaimer.tl}</p>
      </aside>
    </div>
  );
}

function ProviderCard({ provider }: { provider: RemittanceProvider }) {
  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm" data-testid="remittance-provider" data-provider={provider.id}>
      <h3 className="text-lg font-bold text-ink">{provider.name}</h3>
      <p className="mt-2 text-sm font-semibold text-coral-dk" data-testid="check-provider">
        {bi(REMITTANCE_COPY.checkProvider)}
      </p>
      <p className="mt-1 text-sm text-muted">{provider.notes.en}</p>
      <p className="mt-1 text-sm text-muted">{provider.notes.tl}</p>
      <a
        className="btn mt-4 inline-block px-4 py-2 text-sm"
        href={provider.url}
        rel="noopener noreferrer"
        target="_blank"
        onClick={() => track("remittance_provider_click", { provider_id: provider.id })}
      >
        {bi(REMITTANCE_COPY.openProvider)}
      </a>
    </li>
  );
}
