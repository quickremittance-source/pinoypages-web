import Link from "next/link";
import { AdGrid } from "@/components/AdCard";
import { JsonLd } from "@/components/JsonLd";
import { adsForRoute, brand, dates, longDate, pages, SITE_URL } from "@/lib/guide";

export default function Home() {
  const contents = pages.filter((p) => p.section !== "ad" && p.section !== "cover");
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: brand.name, url: SITE_URL }} />
      <section className="bg-gradient-to-b from-turq to-aqua">
        <div className="mx-auto max-w-5xl px-4 py-14">
          <p className="kicker">Page 2 · Welcome</p>
          <h1 className="mt-2 text-5xl font-semibold text-sea">
            {brand.name} {brand.edition}
          </h1>
          <p className="mt-4 max-w-2xl text-xl">{brand.tagline}.</p>
          <p className="mt-4 max-w-2xl">
            This site mirrors the printed guide page for page. Every QR code in print opens the matching page here.
            Printed edition: {longDate(dates.inPrint)}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn" href="/directory">
              Browse the directory
            </Link>
            <Link className="btn bg-sea" href="/upgrade">
              Claim your free listing
            </Link>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-5xl px-4 py-10" aria-labelledby="toc">
        <h2 id="toc" className="text-2xl font-semibold text-sea">
          Inside the guide
        </h2>
        <ol className="mt-4 grid gap-2 sm:grid-cols-2">
          {contents.map((p) => (
            <li key={p.page}>
              <Link href={p.route} className="flex gap-3 rounded-lg bg-white p-3 hover:bg-sand">
                <span className="font-display text-coral-dk">p.{p.page}</span> {p.title}
              </Link>
            </li>
          ))}
        </ol>
      </section>
      <AdGrid ads={adsForRoute("/")} />
    </>
  );
}
