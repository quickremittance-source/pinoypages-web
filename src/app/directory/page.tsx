import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute, categories, listingsIn } from "@/lib/guide";

export const metadata: Metadata = { title: "Directory", alternates: { canonical: "/directory" } };

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Directory"
        title="Directory listings"
        intro="Free listings, in the same order as guide pages 8–11."
      />
      <ul className="mx-auto grid max-w-5xl gap-3 px-4 py-8 sm:grid-cols-2">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link href={`/directory/${c.slug}`} className="block rounded-xl bg-white p-4 hover:bg-sand">
              <span className="font-display text-coral-dk">p.{c.page}</span>{" "}
              <strong className="text-sea">{c.name}</strong>
              <span className="block text-sm">{listingsIn(c.slug).length} listings</span>
            </Link>
          </li>
        ))}
      </ul>
      <AdGrid ads={adsForRoute("/directory")} />
    </>
  );
}
