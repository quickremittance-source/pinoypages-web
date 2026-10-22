"use client";
import Link from "next/link";
import { useState } from "react";
import type { AltCard } from "./data";

const GRADS = [
  "from-phred to-[#f2b705]",
  "from-turqdk to-[#7fd1d8]",
  "from-[#1b2328] to-turqdk",
  "from-[#9e0c24] to-phred",
];

export function FeaturedGrid({ cards, areas }: { cards: AltCard[]; areas: readonly string[] }) {
  const [area, setArea] = useState("");
  const tabs = ["", ...areas.filter((a) => cards.some((c) => c.area === a))];
  const shown = cards.filter((c) => !area || c.area === area);
  return (
    <div>
      <div
        role="group"
        aria-label="Filter by area"
        className="flex gap-2 overflow-x-auto pb-2"
        data-testid="alt-area-tabs"
      >
        {tabs.map((t) => (
          <button
            key={t || "all"}
            type="button"
            aria-pressed={area === t}
            onClick={() => setArea(t)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm font-semibold ${
              area === t ? "border-ink bg-ink text-white" : "border-ink/20 bg-white text-ink hover:border-ink"
            }`}
          >
            {t || "All GTA"}
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3" data-testid="alt-featured">
        {shown.map((c, i) => (
          <li key={c.id} data-area={c.area}>
            <Link href={`/listing/${c.id}`} className="group block">
              <div
                className={`relative grid aspect-[4/3] place-items-center overflow-hidden rounded-2xl bg-gradient-to-br ${GRADS[i % GRADS.length]}`}
                aria-hidden="true"
              >
                <span className="text-6xl drop-shadow">{c.icon}</span>
                {c.sample && (
                  <span className="absolute top-3 left-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-ink">
                    SAMPLE
                  </span>
                )}
                <span className="absolute top-3 right-3 rounded-md bg-white/90 px-2 py-0.5 text-[11px] font-bold text-turqdk">
                  Verified Kabayan
                </span>
              </div>
              <div className="mt-3">
                <p className="font-bold text-ink group-hover:underline">{c.name}</p>
                <p className="text-sm text-muted">
                  {c.category} · {c.area}
                </p>
                {c.tagline && <p className="mt-0.5 text-sm text-ink/80">{c.tagline}</p>}
                <p className="mt-0.5 text-xs text-muted">Languages: {c.languages}</p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
