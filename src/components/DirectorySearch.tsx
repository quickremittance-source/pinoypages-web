"use client";

import { useEffect, useMemo, useState } from "react";

type Opt = { value: string; label: string };

/**
 * Client-side filter over server-rendered listings (progressive enhancement: without JS every listing shows).
 * Matches li[data-listing] inside #<target> on name (data-name), sub-category (data-sub), city (data-city) and
 * language (data-langs). State is mirrored to the URL (?q=&sub=&city=&lang=) so a filtered view can be shared.
 */
export function DirectorySearch({
  target,
  subs,
  cities,
  languages,
  extraTarget,
}: {
  target: string;
  /** Optional second root (e.g. the free public listings) filtered by the same controls. */
  extraTarget?: string;
  subs?: Opt[];
  cities: string[];
  languages: string[];
}) {
  const [q, setQ] = useState("");
  const [sub, setSub] = useState("");
  const [city, setCity] = useState("");
  const [lang, setLang] = useState("");
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setQ(p.get("q") ?? "");
    setSub(p.get("sub") ?? "");
    setCity(p.get("city") ?? "");
    setLang(p.get("lang") ?? "");
  }, []);

  const filters = useMemo(() => ({ q: q.trim().toLowerCase(), sub, city, lang }), [q, sub, city, lang]);

  useEffect(() => {
    const root = document.getElementById(target);
    if (!root) return;
    let n = 0;
    const extra = extraTarget ? document.getElementById(extraTarget) : null;
    const lis = [
      ...root.querySelectorAll<HTMLElement>("li[data-listing]"),
      ...(extra ? extra.querySelectorAll<HTMLElement>("li[data-listing]") : []),
    ];
    lis.forEach((li) => {
      const d = li.dataset;
      const ok =
        (!filters.q || (d.name ?? "").includes(filters.q)) &&
        (!filters.sub || d.sub === filters.sub) &&
        (!filters.city || d.city === filters.city) &&
        (!filters.lang || (d.langs ?? "").split(", ").includes(filters.lang));
      li.hidden = !ok;
      if (ok) n++;
    });
    // Hide group headings whose lists are now empty.
    [
      ...root.querySelectorAll<HTMLElement>("[data-group]"),
      ...(extra?.querySelectorAll<HTMLElement>("[data-group]") ?? []),
    ].forEach((g) => {
      g.hidden = !g.querySelector("li[data-listing]:not([hidden])");
    });
    setShown(n);
    // "Be the first Verified …" prompt when no active Verified business matches.
    const cta = root.querySelector<HTMLElement>("[data-first-cta]");
    if (cta) {
      const active = root.querySelector('li[data-badge="active"]:not([hidden])');
      cta.hidden = !!active;
      const subName = filters.sub ? (subs?.find((x) => x.value === filters.sub)?.label ?? "") : (cta.dataset.sub ?? "");
      const subEl = cta.querySelector<HTMLElement>("[data-first-sub]");
      const cityEl = cta.querySelector<HTMLElement>("[data-first-city]");
      if (subEl) subEl.textContent = subName ? `${subName} business` : "business";
      if (cityEl) cityEl.textContent = filters.city ? `in ${filters.city}` : "in your area";
    }
    const p = new URLSearchParams();
    if (filters.q) p.set("q", filters.q);
    if (filters.sub) p.set("sub", filters.sub);
    if (filters.city) p.set("city", filters.city);
    if (filters.lang) p.set("lang", filters.lang);
    const qs = p.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, target, extraTarget, subs]);

  const active = !!(filters.q || sub || city || lang);
  const sel = "field mt-1 py-2";
  return (
    <form
      role="search"
      aria-label="Search the directory"
      className="card grid grid-cols-2 gap-3 p-4 lg:grid-cols-[2fr_1fr_1fr_1fr_auto] lg:items-end"
      onSubmit={(e) => e.preventDefault()}
    >
      <label className="col-span-2 block text-sm font-semibold lg:col-span-1">
        Business name
        <input
          className={sel}
          type="search"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. Bituin"
          autoComplete="off"
        />
      </label>
      {subs && subs.length > 1 && (
        <label className="col-span-2 block text-sm font-semibold lg:col-span-1">
          Sub-category
          <select className={sel} name="sub" value={sub} onChange={(e) => setSub(e.target.value)}>
            <option value="">All</option>
            {subs.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      )}
      <label className="block text-sm font-semibold">
        City
        <select className={sel} name="city" value={city} onChange={(e) => setCity(e.target.value)}>
          <option value="">All cities</option>
          {cities.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-semibold">
        Language
        <select className={sel} name="lang" value={lang} onChange={(e) => setLang(e.target.value)}>
          <option value="">Any language</option>
          {languages.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <div className="flex items-center gap-3 col-span-2 lg:col-span-1">
        <button
          type="button"
          className="btn btn-ghost px-3 py-2 text-sm disabled:opacity-50"
          disabled={!active}
          onClick={() => {
            setQ("");
            setSub("");
            setCity("");
            setLang("");
          }}
        >
          Clear
        </button>
      </div>
      <p
        role="status"
        aria-live="polite"
        className="text-sm text-muted col-span-2 lg:col-span-5"
        data-testid="search-count"
      >
        {shown === null
          ? ""
          : shown === 0
            ? "No businesses match. Try another city or language."
            : `${shown} business${shown === 1 ? "" : "es"} shown`}
      </p>
    </form>
  );
}
