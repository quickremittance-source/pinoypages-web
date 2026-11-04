/** Shared, dependency-free helpers for the dashboards (safe to import in tests). */
export const RANGES = [7, 30, 90] as const;
export type RangeDays = (typeof RANGES)[number];
export const rangeDays = (v?: string | null): RangeDays => {
  const n = Number(v);
  return (RANGES as readonly number[]).includes(n) ? (n as RangeDays) : 30;
};
const fmt = (d: Date) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto", year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
/** Inclusive Toronto-day window ending today. */
export function windowOf(days: number, now = new Date()) {
  const to = fmt(now);
  const from = fmt(new Date(Date.parse(`${to}T12:00:00Z`) - (days - 1) * 86_400_000));
  return { from, to };
}
/** Every day in the window (so charts show zero days). */
export function daysIn(from: string, to: string): string[] {
  const out: string[] = [];
  for (let t = Date.parse(`${from}T12:00:00Z`); t <= Date.parse(`${to}T12:00:00Z`); t += 86_400_000)
    out.push(new Date(t).toISOString().slice(0, 10));
  return out;
}
/** Fill a sparse day series. */
export const fill = (days: string[], rows: { day: string; n: number }[]) => {
  const m = new Map(rows.map((r) => [r.day, r.n]));
  return days.map((day) => ({ day, n: m.get(day) ?? 0 }));
};
/**
 * Hana rule: a QR target must be on pinoypages.ca and use the existing /go, /card or /qr routes only.
 * Returns the pathname to redirect to, or null. /qr targets are valid but not followed (no redirect loops).
 */
export function qrTarget(url: string): { path: string; follow: boolean } | null {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" || !/^(www\.)?pinoypages\.ca$/.test(u.hostname) || u.username || u.port) return null;
    const m = u.pathname.match(/^\/(go|card|qr)\/[A-Za-z0-9_-]{1,80}$/);
    if (!m) return null;
    return { path: u.pathname + u.search, follow: m[1] !== "qr" };
  } catch {
    return null;
  }
}
