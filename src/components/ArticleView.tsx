import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute, pages } from "@/lib/guide";
import { readArticle, type Article } from "@/lib/magazine";

export function ArticleView({ a, lang }: { a: Article; lang: "en" | "tl" }) {
  const { html } = readArticle(a, lang);
  const route = `/magazine/${a.slug}`;
  const p = pages.find((x) => x.route === route);
  return (
    <>
      <PageHead kicker="Magazine" page={p?.page} title={a.title} />
      <div className="mx-auto max-w-3xl px-4 py-8">
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
          className="prose-article space-y-3 rounded-2xl bg-white p-6"
          lang={lang}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
      <AdGrid ads={adsForRoute(route)} />
    </>
  );
}
