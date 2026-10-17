import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute, destinations, pages } from "@/lib/guide";

export const metadata: Metadata = { title: "Philippine destinations", alternates: { canonical: "/destinations" } };

export default function Page() {
  return (
    <>
      <PageHead kicker="Uwi na tayo" title="Philippine destinations" intro="Guide pages 14–16." />
      <ul className="mx-auto grid max-w-5xl gap-3 px-4 py-8 sm:grid-cols-3">
        {destinations.map((d) => (
          <li key={d.slug}>
            <Link href={`/destinations/${d.slug}`} className="block rounded-xl bg-white p-4 hover:bg-sand">
              <span className="font-display text-coral-dk">
                p.{pages.find((p) => p.route === `/destinations/${d.slug}`)?.page}
              </span>{" "}
              <strong className="text-sea">{d.name}</strong>
              <span className="block text-sm">{d.region}</span>
            </Link>
          </li>
        ))}
      </ul>
      <AdGrid ads={adsForRoute("/destinations")} />
    </>
  );
}
