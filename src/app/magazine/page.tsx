import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute, brand, pages } from "@/lib/guide";
import { articles } from "@/lib/magazine";
import { SignupForm } from "@/components/Forms";

export const metadata: Metadata = { title: "Magazine", alternates: { canonical: "/magazine" } };

export default function Page() {
  return (
    <>
      <PageHead
        kicker={`${brand.editionLabel} · Magazine`}
        title="Magazine"
        intro="Short money and business articles from the front of the printed edition, in English and Tagalog."
      />
      <ul className="mx-auto grid max-w-5xl gap-3 px-4 py-8 sm:grid-cols-2">
        {articles.map((a) => {
          const p = pages.find((x) => x.route === `/magazine/${a.slug}`)?.page;
          return (
            <li key={a.slug}>
              <Link href={`/magazine/${a.slug}`} className="block rounded-xl bg-white p-4 hover:bg-sand">
                {p && <span className="font-display text-coral-dk">p.{p} </span>}
                <strong className="text-sea">{a.title}</strong>
              </Link>
            </li>
          );
        })}
      </ul>
      <section className="mx-auto max-w-3xl px-4" aria-labelledby="signup">
        <h2 id="signup" className="mb-3 text-2xl font-semibold text-sea">
          Get the monthly member email
        </h2>
        <SignupForm />
      </section>
      <AdGrid ads={adsForRoute("/magazine")} />
    </>
  );
}
