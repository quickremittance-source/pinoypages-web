import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { brand, pages } from "@/lib/guide";

export const metadata: Metadata = { title: brand.editionName, alternates: { canonical: "/edition" } };

/** The edition's page order, mirrored online: magazine up front, directory at the back. */
export default function Page() {
  const parts = [
    { id: "magazine", name: "Magazine", items: pages.filter((p) => p.part === "magazine" && p.section !== "ad") },
    { id: "directory", name: "Directory", items: pages.filter((p) => p.part === "directory" && p.section !== "ad") },
  ];
  return (
    <>
      <PageHead
        kicker="Annual edition"
        page={1}
        title={brand.editionName}
        intro={`${brand.seasons}. Magazine + directory. ${brand.validity} Every page is mirrored here and updated year-round.`}
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
        {parts.map((part) => (
          <section key={part.id} aria-labelledby={part.id}>
            <h2 id={part.id} className="text-2xl font-semibold text-sea">
              {part.name}
            </h2>
            <ol className="mt-3 space-y-2">
              {part.items.map((p) => (
                <li key={p.page}>
                  <Link href={p.route} className="block rounded-xl bg-white p-3 hover:bg-sand">
                    <span className="font-display text-coral-dk">p.{p.page}</span> {p.title}
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </>
  );
}
