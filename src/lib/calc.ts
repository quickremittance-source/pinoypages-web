/** 2026 CRA figures. Sources: canada.ca CPP contribution rates (2026) and GST/HST small-supplier rules. */
export const CPP_2026 = {
  rate: 0.119,
  basicExemption: 3500,
  ympe: 74600,
  maxBase: 8460.9,
  cpp2Rate: 0.08,
  yampe: 85000,
  maxCpp2: 832,
};
export const HST_THRESHOLD = 30000;

export function selfEmployedCpp(netIncome: number) {
  const n = Math.max(0, netIncome || 0);
  const base = Math.min(
    Math.max(0, Math.min(n, CPP_2026.ympe) - CPP_2026.basicExemption) * CPP_2026.rate,
    CPP_2026.maxBase,
  );
  const cpp2 = Math.min(Math.max(0, Math.min(n, CPP_2026.yampe) - CPP_2026.ympe) * CPP_2026.cpp2Rate, CPP_2026.maxCpp2);
  return { base: round2(base), cpp2: round2(cpp2), total: round2(base + cpp2) };
}

export type HstResult = { verdict: "must-now" | "must-soon" | "optional"; message: string };
export function hstCheck(quarters: number[], rideshare = false): HstResult {
  const q = quarters.map((x) => Math.max(0, x || 0));
  const total = q.reduce((a, b) => a + b, 0);
  if (rideshare)
    return {
      verdict: "must-now",
      message: "Taxi and ride-share drivers must register for GST/HST from day one, at any income.",
    };
  if (q.some((x) => x > HST_THRESHOLD))
    return {
      verdict: "must-now",
      message:
        "One quarter is over $30,000: you must register and charge HST starting with the sale that put you over.",
    };
  if (total > HST_THRESHOLD)
    return {
      verdict: "must-soon",
      message: `Your last four quarters total $${total.toLocaleString("en-CA")}, over $30,000: you must register by the end of the month after the quarter you went over.`,
    };
  return {
    verdict: "optional",
    message: `Your last four quarters total $${total.toLocaleString("en-CA")}. You're a small supplier: registering is optional.`,
  };
}
const round2 = (n: number) => Math.round(n * 100) / 100;
