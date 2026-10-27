"use client";

import { useEffect, useState } from "react";
import { track } from "@/lib/gtag";
import { PESO_COPY, bi } from "@/lib/peso";

type Quote = {
  rate: number;
  asOf: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
} | null;

export function PesoTool({ quote }: { quote: Quote }) {
  const [cad, setCad] = useState("100");
  const [php, setPhp] = useState(() => (quote ? (100 * quote.rate).toFixed(2) : ""));

  useEffect(() => {
    track("peso_convert_view", { has_rate: quote ? 1 : 0 });
  }, [quote]);

  function onCad(v: string) {
    setCad(v);
    if (!quote) return;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0) {
      setPhp((n * quote.rate).toFixed(2));
      track("peso_convert", { direction: "cad_to_php", amount: n });
    }
  }

  function onPhp(v: string) {
    setPhp(v);
    if (!quote) return;
    const n = Number(v);
    if (Number.isFinite(n) && n >= 0 && quote.rate > 0) {
      setCad((n / quote.rate).toFixed(2));
      track("peso_convert", { direction: "php_to_cad", amount: n });
    }
  }

  return (
    <div className="space-y-8">
      {quote ? (
        <section className="rounded-2xl bg-aqua/40 p-5" data-testid="peso-rate">
          <p className="text-2xl font-bold text-turqdk">1 CAD = {quote.rate.toFixed(4)} PHP</p>
          <p className="mt-2 text-sm text-muted">
            Source:{" "}
            <a className="font-semibold text-turqdk underline" href={quote.sourceUrl} rel="noopener noreferrer">
              {quote.sourceName}
            </a>
            {" · "}as of {quote.asOf}
            {" · "}fetched {new Date(quote.fetchedAt).toISOString()}
          </p>
        </section>
      ) : (
        <p className="rounded-2xl bg-sand p-5 text-muted" data-testid="peso-unavailable">
          {bi(PESO_COPY.unavailable)}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block font-bold">
          {bi(PESO_COPY.cad)}
          <input
            className="field mt-1"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            value={cad}
            onChange={(e) => onCad(e.target.value)}
            disabled={!quote}
            data-testid="peso-cad"
          />
        </label>
        <label className="block font-bold">
          {bi(PESO_COPY.php)}
          <input
            className="field mt-1"
            inputMode="decimal"
            type="number"
            min="0"
            step="0.01"
            value={php}
            onChange={(e) => onPhp(e.target.value)}
            disabled={!quote}
            data-testid="peso-php"
          />
        </label>
      </div>

      <aside className="rounded-2xl border border-sand bg-white p-5 text-sm text-muted" data-testid="peso-disclaimer">
        <p>{PESO_COPY.disclaimer.en}</p>
        <p className="mt-2">{PESO_COPY.disclaimer.tl}</p>
      </aside>
    </div>
  );
}
