/** 2026 CRA figures. Source: canada.ca CPP contribution rates (2026). */
export const CPP_2026 = {
  rate: 0.119,
  basicExemption: 3500,
  ympe: 74600,
  maxBase: 8460.9,
  cpp2Rate: 0.08,
  yampe: 85000,
  maxCpp2: 832,
};

export function selfEmployedCpp(netIncome: number) {
  const n = Math.max(0, netIncome || 0);
  const base = Math.min(
    Math.max(0, Math.min(n, CPP_2026.ympe) - CPP_2026.basicExemption) * CPP_2026.rate,
    CPP_2026.maxBase,
  );
  const cpp2 = Math.min(Math.max(0, Math.min(n, CPP_2026.yampe) - CPP_2026.ympe) * CPP_2026.cpp2Rate, CPP_2026.maxCpp2);
  return { base: round2(base), cpp2: round2(cpp2), total: round2(base + cpp2) };
}

const round2 = (n: number) => Math.round(n * 100) / 100;
