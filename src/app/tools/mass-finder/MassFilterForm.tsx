import Link from "next/link";
import { EVENT_CITIES } from "@/lib/events";
import { MASS_COPY, bi, type MassFilters } from "@/lib/mass";

export function MassFilterForm({ filters, resultCount }: { filters: MassFilters; resultCount: number }) {
  return (
    <form
      className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm"
      method="get"
      data-testid="mass-filters"
    >
      <label className="block text-sm font-bold">
        {bi(MASS_COPY.city)}
        <select className="field mt-1" name="city" defaultValue={filters.city}>
          <option value="">All cities</option>
          {EVENT_CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-sm font-bold">
        {bi(MASS_COPY.search)}
        <input className="field mt-1" name="q" type="search" defaultValue={filters.q} placeholder="Parish, city…" />
      </label>
      <label className="flex items-center gap-2 pb-2 text-sm font-bold">
        <input type="checkbox" name="simbang" value="1" defaultChecked={filters.simbang} />
        {bi(MASS_COPY.simbangOnly)}
      </label>
      <button type="submit" className="btn px-4 py-2 text-sm">
        {bi(MASS_COPY.search)}
      </button>
      <p className="w-full text-sm text-muted" data-testid="mass-count">
        {resultCount === 0 ? bi(MASS_COPY.empty) : `${resultCount} Mass${resultCount === 1 ? "" : "es"}`}
      </p>
      <p className="w-full text-sm">
        <Link href="/events" className="font-semibold text-turqdk underline">
          All community events · Lahat ng kaganapan
        </Link>
      </p>
    </form>
  );
}
