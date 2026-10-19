"use client";

import { useEffect, useState } from "react";

type Opt = { value: string; label: string };

/**
 * Progressive enhancement for /calendar: view toggle (list | month), month paging and filters by category, city and
 * free/featured. Without JS the full list shows. Reads/writes ?view=&cat=&city=&tier=&m= so views can be shared.
 */
export function CalendarControls({
  target,
  months,
  initialMonth,
  cats,
  cities,
}: {
  target: string;
  months: Opt[];
  initialMonth: string;
  cats: Opt[];
  cities: string[];
}) {
  const [view, setView] = useState<"list" | "month">("list");
  const [month, setMonth] = useState(initialMonth);
  const [cat, setCat] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("view") === "month") setView("month");
    if (p.get("m") && months.some((m) => m.value === p.get("m"))) setMonth(p.get("m")!);
    setCat(p.get("cat") ?? "");
    setCity(p.get("city") ?? "");
    setTier(p.get("tier") ?? "");
  }, [months]);

  useEffect(() => {
    const root = document.getElementById(target);
    if (!root) return;
    root.dataset.view = view;
    const match = (el: HTMLElement) =>
      (!cat || el.dataset.cat === cat) &&
      (!city || el.dataset.city === city) &&
      (!tier || el.dataset.eventTier === tier);
    let n = 0;
    root.querySelectorAll<HTMLElement>("[data-ev]").forEach((el) => {
      const ok = match(el);
      el.hidden = !ok;
      if (ok && el.closest("[data-list]")) n++;
    });
    root.querySelectorAll<HTMLElement>("[data-month-group]").forEach((g) => {
      g.hidden = !g.querySelector("[data-ev]:not([hidden])");
    });
    root.querySelectorAll<HTMLElement>("[data-month-grid]").forEach((g) => {
      g.hidden = g.dataset.monthGrid !== month;
    });
    setShown(n);
    const p = new URLSearchParams();
    if (view !== "list") p.set("view", view);
    if (view === "month") p.set("m", month);
    if (cat) p.set("cat", cat);
    if (city) p.set("city", city);
    if (tier) p.set("tier", tier);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [target, view, month, cat, city, tier]);

  const i = months.findIndex((m) => m.value === month);
  const sel = "field mt-1 py-2";
  return (
    <div className="card space-y-3 p-4" role="group" aria-label="Calendar view and filters">
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-lg border border-turqdk p-0.5" role="group" aria-label="View">
          {(["list", "month"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={`rounded-md px-3 py-1.5 text-sm font-semibold ${view === v ? "bg-turqdk text-white" : "text-turqdk"}`}
            >
              {v === "list" ? "List view" : "Month view"}
            </button>
          ))}
        </div>
        {view === "month" && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              className="btn btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={i <= 0}
              onClick={() => setMonth(months[i - 1]!.value)}
              aria-label="Previous month"
            >
              ‹
            </button>
            <span className="min-w-36 text-center font-bold" aria-live="polite" data-testid="month-label">
              {months[i]?.label}
            </span>
            <button
              type="button"
              className="btn btn-ghost px-3 py-1.5 text-sm disabled:opacity-40"
              disabled={i >= months.length - 1}
              onClick={() => setMonth(months[i + 1]!.value)}
              aria-label="Next month"
            >
              ›
            </button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <label className="block text-sm font-semibold">
          Category
          <select className={sel} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          City
          <select className={sel} value={city} onChange={(e) => setCity(e.target.value)}>
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Listing type
          <select className={sel} value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="">Free and featured</option>
            <option value="free">Free events</option>
            <option value="featured">Featured events</option>
          </select>
        </label>
        <p className="col-span-2 self-end text-sm text-muted lg:col-span-1" role="status" data-testid="event-count">
          {shown === null
            ? ""
            : shown === 0
              ? "No events match these filters."
              : `${shown} event${shown === 1 ? "" : "s"}`}
        </p>
      </div>
    </div>
  );
}
