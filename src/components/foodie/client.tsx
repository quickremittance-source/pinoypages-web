"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { areaForPostal, areaName } from "@/lib/foodie/areas";

const FF = "/filipinofoodie";

export function NearYou() {
  const [pc, setPc] = useState("");
  const area = areaForPostal(pc);
  return (
    <div className="card p-4">
      <label className="text-sm font-semibold" htmlFor="ff-postal">
        Near you: enter your postal code
      </label>
      <input
        id="ff-postal"
        value={pc}
        onChange={(e) => setPc(e.target.value)}
        maxLength={7}
        placeholder="e.g. M3H"
        className="mt-1 block w-40 rounded border border-sand px-2 py-1"
      />
      {pc.length >= 3 ? (
        area ? (
          <p className="mt-2 text-sm">
            Closest area (approximate):{" "}
            <Link className="font-semibold text-turqdk underline" href={`${FF}/gta/${area}`}>
              {areaName(area)}
            </Link>
          </p>
        ) : (
          <p className="mt-2 text-sm text-muted">We don&apos;t cover that postal code yet.</p>
        )
      ) : null}
    </div>
  );
}

type Item = { slug: string; name: string; meta: string; dishes: string[] };
export function RestaurantFilter({ items }: { items: Item[] }) {
  const [q, setQ] = useState("");
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t
      ? items.filter((i) => (i.name + " " + i.meta + " " + i.dishes.join(" ")).toLowerCase().includes(t))
      : items;
  }, [q, items]);
  return (
    <div>
      <label htmlFor="ff-q" className="sr-only">
        Search restaurants or dishes
      </label>
      <input
        id="ff-q"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search by name, area or dish (e.g. sisig)"
        className="mb-3 block w-full rounded border border-sand px-3 py-2"
      />
      <p className="mb-2 text-sm text-muted">{shown.length} results</p>
      <ul className="grid gap-2 sm:grid-cols-2">
        {shown.map((i) => (
          <li key={i.slug} className="card p-3">
            <Link href={`${FF}/restaurants/${i.slug}`} className="font-bold text-sea hover:underline">
              {i.name}
            </Link>
            <p className="text-sm text-muted">{i.meta}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Click-to-load facade: no YouTube request until the visitor presses play; then a youtube-nocookie embed. */
export function VideoFacade({ id, title, thumb }: { id: string; title: string; thumb: string }) {
  const [on, setOn] = useState(false);
  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-ink">
      {on ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      ) : (
        <button type="button" onClick={() => setOn(true)} className="absolute inset-0" aria-label={`Play ${title}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          <span className="absolute inset-0 m-auto flex h-14 w-14 items-center justify-center rounded-full bg-coral text-2xl text-white">
            ▶
          </span>
        </button>
      )}
    </div>
  );
}
