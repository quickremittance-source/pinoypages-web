/** Keyless CAD/PHP mid-market fetch. Prefer frankfurter.dev, fall back to open.er-api.com. */
export type FxQuote = {
  base: "CAD";
  quote: "PHP";
  rate: number;
  /** ISO date (YYYY-MM-DD) or full UTC string from the provider. */
  asOf: string;
  sourceName: string;
  sourceUrl: string;
  fetchedAt: string;
};

async function frankfurter(): Promise<FxQuote | null> {
  const res = await fetch("https://api.frankfurter.dev/v1/latest?base=CAD&symbols=PHP", {
    next: { revalidate: 3600 },
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { base?: string; date?: string; rates?: { PHP?: number } };
  const rate = j.rates?.PHP;
  if (typeof rate !== "number" || !Number.isFinite(rate)) return null;
  return {
    base: "CAD",
    quote: "PHP",
    rate,
    asOf: j.date ?? new Date().toISOString().slice(0, 10),
    sourceName: "Frankfurter (European Central Bank reference)",
    sourceUrl: "https://www.frankfurter.app/",
    fetchedAt: new Date().toISOString(),
  };
}

async function openErApi(): Promise<FxQuote | null> {
  const res = await fetch("https://open.er-api.com/v6/latest/CAD", { next: { revalidate: 3600 } });
  if (!res.ok) return null;
  const j = (await res.json()) as {
    result?: string;
    rates?: { PHP?: number };
    time_last_update_utc?: string;
    provider?: string;
  };
  const rate = j.rates?.PHP;
  if (j.result !== "success" || typeof rate !== "number" || !Number.isFinite(rate)) return null;
  return {
    base: "CAD",
    quote: "PHP",
    rate,
    asOf: j.time_last_update_utc ?? new Date().toISOString(),
    sourceName: "ExchangeRate-API (open.er-api.com)",
    sourceUrl: "https://www.exchangerate-api.com/docs/free",
    fetchedAt: new Date().toISOString(),
  };
}

/** Returns a live CAD→PHP mid-market quote, or null if both keyless sources fail. */
export async function fetchCadPhp(): Promise<FxQuote | null> {
  try {
    const a = await frankfurter();
    if (a) return a;
  } catch {
    /* try fallback */
  }
  try {
    return await openErApi();
  } catch {
    return null;
  }
}
