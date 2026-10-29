import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { PageHead } from "@/components/Chrome";
import { isBot } from "@/lib/analytics/events";
import { directoryFilterOptions } from "@/lib/directory";
import { KIND_LABEL, logSearch, parseSearch, searchSite } from "@/lib/search";
import { recordSponsored, sponsoredFor } from "@/lib/sponsored";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Search", robots: { index: false, follow: true } };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const input = parseSearch(await searchParams);
  const { categories, areas } = directoryFilterOptions();
  const [hits, sponsored] = input.q
    ? await Promise.all([searchSite(input), sponsoredFor(input.q, input.category)])
    : [[], []];
  if (input.q && !isBot((await headers()).get("user-agent"))) {
    await Promise.all([logSearch(input.q, hits.length), ...sponsored.map((s) => recordSponsored(s.id, "impression"))]);
  }
  return (
    <>
      <PageHead
        kicker="Search"
        title="Search Pinoy Pages"
        intro="Businesses, events, magazine articles and zcard pages."
      />
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
        <form action="/search" method="get" className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
          <label className="sr-only" htmlFor="search-q">
            Search
          </label>
          <input
            id="search-q"
            name="q"
            type="search"
            defaultValue={input.q}
            maxLength={100}
            className="rounded-md border border-sand px-3 py-2"
            placeholder="What are you looking for?"
          />
          <select
            name="category"
            defaultValue={input.category}
            aria-label="Category"
            className="rounded-md border border-sand px-2 py-2"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            name="city"
            defaultValue={input.city}
            aria-label="City"
            className="rounded-md border border-sand px-2 py-2"
          >
            <option value="">All GTA cities</option>
            {areas.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <button className="btn" type="submit">
            Search
          </button>
        </form>
        {!input.q ? (
          <p className="text-muted">Type a business name, service, category or city.</p>
        ) : (
          <>
            <p className="text-sm text-muted" data-testid="search-count">
              {hits.length} result{hits.length === 1 ? "" : "s"} for “{input.q}”
            </p>
            {sponsored.length > 0 && (
              <ul className="space-y-2" data-testid="sponsored-results" aria-label="Sponsored results">
                {sponsored.map((s) => (
                  <li key={s.id} className="rounded-xl border-2 border-sunset bg-sand/60 p-4">
                    <span className="rounded bg-ink px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white uppercase">
                      Sponsored
                    </span>
                    <a href={`/api/sponsored/${s.id}`} className="mt-1 block text-lg font-bold text-turqdk underline">
                      {s.title}
                      {s.is_demo ? " (demo)" : ""}
                    </a>
                    {s.blurb && <p className="text-sm text-muted">{s.blurb}</p>}
                  </li>
                ))}
              </ul>
            )}
            <ul className="divide-y divide-sand" data-testid="search-results">
              {hits.map((h) => (
                <li key={`${h.kind}:${h.href}`} className="py-3" data-kind={h.kind}>
                  <span className="text-xs font-bold text-phred uppercase">{KIND_LABEL[h.kind]}</span>
                  <Link href={h.href} className="block font-semibold text-ink hover:underline">
                    {h.title}
                  </Link>
                  {h.meta && <p className="text-sm text-muted">{h.meta}</p>}
                </li>
              ))}
            </ul>
            {hits.length === 0 && (
              <p>
                No matches. Try fewer words, or browse the{" "}
                <Link href="/directory" className="underline">
                  directory
                </Link>
                .
              </p>
            )}
          </>
        )}
      </div>
    </>
  );
}
