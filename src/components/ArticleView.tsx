import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { ListingCard } from "@/components/ListingCard";
import { adsForRoute, listingById, pages, type Listing } from "@/lib/guide";
import { KIND_LABEL, readArticle, type Article } from "@/lib/magazine";
import { liveTools } from "@/lib/registry";

const TOOL_NAMES: Record<string, string> = {
  ...Object.fromEntries(liveTools.map((t) => [t.route, t.title])),
  "/tax-deadlines": "2027 tax deadlines",
  "/calendar": "Money & Business Calendar",
};
const SEASON = { spring: "Spring", summer: "Summer", fall: "Fall" } as const;

export function ArticleView({ a, lang }: { a: Article; lang: "en" | "tl" }) {
  const { html } = readArticle(a, lang);
  const route = `/magazine/${a.slug}`;
  const p = pages.find((x) => x.route === route);
  const related = (a.listings ?? []).map(listingById).filter((l): l is Listing => !!l);
  return (
    <>
      <PageHead
        kicker={
          a.sample
            ? `${a.kind ? KIND_LABEL[a.kind] : "Magazine"} · ${a.season ? SEASON[a.season] : ""} · SAMPLE`
            : "Magazine"
        }
        page={p?.page}
        title={a.title}
        intro={a.dek}
      >
        {a.sample && (
          <p className="mt-3 text-sm text-muted" data-testid="byline">
            By <strong className="text-ink">{a.author ?? "Pinoy Pages Editorial (SAMPLE)"}</strong>
          </p>
        )}
      </PageHead>
      <div className={`mx-auto px-4 py-8 ${a.sample ? "grid max-w-6xl gap-8 lg:grid-cols-[1fr_320px]" : "max-w-3xl"}`}>
        <div>
          <p className="mb-4 text-sm">
            {lang === "en" ? (
              a.tl && (
                <Link className="underline" href={`${route}/tl`} hrefLang="tl">
                  Basahin sa Tagalog
                </Link>
              )
            ) : (
              <Link className="underline" href={route} hrefLang="en">
                Read in English
              </Link>
            )}
            {p && "toolQr" in p && p.toolQr && (
              <>
                {" · "}
                <Link className="underline" href={p.toolQr}>
                  Open the free tool
                </Link>
              </>
            )}
          </p>
          <article
            className={`prose-article card p-6 sm:p-8 ${a.sample ? "dropcap" : ""}`}
            lang={lang}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {a.sample && (
            <section
              className="card mt-6 border-l-4 border-l-phred p-5"
              aria-labelledby="cta"
              data-testid="article-cta"
            >
              <h2 id="cta" className="text-lg font-bold text-ink">
                Featured in this story? Get Verified
              </h2>
              <p className="mt-1 text-sm text-muted">
                Every business in our stories is drawn from the directory. Verified businesses earn the badge through an
                in-person visit and a mutual vouch, and receive a ZCard and a monthly scan report. Listing is free.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href="/get-verified" className="btn px-4 py-2 text-sm">
                  Get Verified · $199
                </Link>
                <Link href="/list-free" className="btn btn-ghost px-4 py-2 text-sm">
                  List your business free
                </Link>
              </div>
            </section>
          )}
        </div>
        {a.sample && (
          <aside aria-label="In this story" className="space-y-6">
            {related.length > 0 && (
              <section aria-labelledby="in-story">
                <h2 id="in-story" className="mb-3 text-lg font-bold text-ink">
                  Businesses in this story
                </h2>
                <ul className="grid gap-3">
                  {related.map((l) => (
                    <ListingCard key={l.id} l={l} compact />
                  ))}
                </ul>
              </section>
            )}
            {(a.tools ?? []).length > 0 && (
              <section aria-labelledby="tools-h" className="card p-4">
                <h2 id="tools-h" className="font-bold text-ink">
                  Free tools
                </h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {a.tools!.map((t) => (
                    <li key={t}>
                      <Link className="font-semibold text-turqdk underline" href={t}>
                        {TOOL_NAMES[t] ?? t}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        )}
      </div>
      <AdGrid ads={adsForRoute(route)} />
    </>
  );
}
