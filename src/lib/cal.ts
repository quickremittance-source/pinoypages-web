import type { CalEvent } from "@/lib/guide";

export const monthKeyOf = (d: string) => d.slice(0, 7);
export const monthLabel = (m: string) =>
  new Date(`${m}-15T12:00:00Z`).toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" });
export const dayLabel = (d: string) =>
  new Date(`${d}T12:00:00Z`).toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
/** Featured events first within a month, then by date. */
export const byMonthFeaturedFirst = (a: CalEvent, b: CalEvent) =>
  monthKeyOf(a.date).localeCompare(monthKeyOf(b.date)) ||
  Number(b.tier === "featured") - Number(a.tier === "featured") ||
  a.date.localeCompare(b.date);
/** Calendar grid for a month: weeks of 7 cells (Sunday first), null = outside the month. */
export function monthGrid(m: string) {
  const [y, mo] = m.split("-").map(Number) as [number, number];
  const first = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first }, () => null);
  for (let d = 1; d <= days; d++) cells.push(`${m}-${String(d).padStart(2, "0")}`);
  while (cells.length % 7) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}
