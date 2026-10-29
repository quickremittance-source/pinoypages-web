/** Site search box (plain GET form, works without JavaScript). */
export function SearchBox({ q = "", className = "", id = "site-q" }: { q?: string; className?: string; id?: string }) {
  return (
    <form action="/search" method="get" className={`flex gap-1 ${className}`}>
      <label htmlFor={id} className="sr-only">
        Search Pinoy Pages
      </label>
      <input
        id={id}
        name="q"
        type="search"
        defaultValue={q}
        placeholder="Search businesses, events…"
        maxLength={100}
        className="w-full min-w-0 rounded-md border border-sand px-2.5 py-1.5 text-sm"
        data-testid={id}
      />
      <button type="submit" className="btn px-3 py-1.5 text-sm">
        Search
      </button>
    </form>
  );
}
