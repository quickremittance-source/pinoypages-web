import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { categories } from "@/lib/guide";

export const metadata: Metadata = { title: "Pinoy Pages Awards (preview)", alternates: { canonical: "/awards" } };

const AWARDS = [
  {
    id: "boty",
    name: "Business of the Year",
    who: "One Verified business across the directory",
    how: "Chosen by a small panel from Verified members, looking at service, community work and member feedback.",
  },
  {
    id: "adoty",
    name: "Ad of the Year",
    who: "The best ad in the April 2027 edition",
    how: "Judged on clarity, design and a QR that works, from ads placed in the edition.",
  },
  {
    id: "pick",
    name: "Kabayan’s Pick",
    who: "The members’ favourite",
    how: "Decided by member vote: one vote per member email, counted once voting closes.",
  },
];

function Trophy() {
  return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="h-12 w-12" focusable="false">
      <path d="M14 6h20v8c0 6-4.5 11-10 11S14 20 14 14z" fill="#C8102E" />
      <path d="M14 9H7c0 6 3 9 7 9.5M34 9h7c0 6-3 9-7 9.5" fill="none" stroke="#C8102E" strokeWidth="2.5" />
      <rect x="21" y="25" width="6" height="8" fill="#0E7C86" />
      <rect x="14" y="33" width="20" height="5" rx="1.5" fill="#0E7C86" />
      <rect x="11" y="40" width="26" height="3" rx="1.5" fill="#0A5F67" />
    </svg>
  );
}

/** Preview of the awards programme. Nothing is open yet: no nominations, no voting. */
export default function Page() {
  return (
    <>
      <PageHead
        kicker="Pinoy Pages Awards · Preview"
        title="Celebrating kabayan businesses"
        intro="Coming April 2027. Awards for the businesses our community trusts, announced with the April 2027 edition."
      >
        <p
          className="mt-4 inline-block rounded-md bg-phred px-3 py-1 text-sm font-bold text-white"
          data-testid="awards-coming"
        >
          Coming April 2027
        </p>
      </PageHead>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-10">
        <section aria-labelledby="main-awards">
          <h2 id="main-awards" className="text-2xl font-bold text-ink">
            The awards
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-3">
            {AWARDS.map((a) => (
              <li key={a.id} className="card flex flex-col p-6" data-award={a.id}>
                <Trophy />
                <h3 className="mt-3 text-xl font-extrabold text-ink">{a.name}</h3>
                <p className="mt-1 font-semibold text-sea">{a.who}</p>
                <p className="mt-2 text-sm text-muted">{a.how}</p>
                <p className="mt-auto pt-4 text-xs font-bold tracking-wider text-red-dk uppercase">Coming April 2027</p>
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="cat-awards">
          <h2 id="cat-awards" className="text-2xl font-bold text-ink">
            Category awards
          </h2>
          <p className="mt-1 text-muted">One award per sub-category in Money &amp; Business.</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <li key={c.slug} className="card p-4" data-award={`cat-${c.slug}`}>
                <p className="kicker">Category award</p>
                <p className="mt-1 font-bold text-ink">Best in {c.name}</p>
              </li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="who"
          className="card pinstripe-bg grid gap-4 p-6 md:grid-cols-[2fr_1fr] md:items-center"
        >
          <div>
            <h2 id="who" className="text-xl font-bold text-ink">
              Who can win?
            </h2>
            <p className="mt-2 text-muted">
              Verified businesses with an active badge are eligible for Business of the Year, Kabayan’s Pick and the
              category awards. Rules, dates and voting open with the April 2027 edition. Nothing to sign up for yet.
            </p>
          </div>
          <Link href="/get-verified" className="btn justify-self-start md:justify-self-end">
            Get Verified to be eligible
          </Link>
        </section>
      </div>
    </>
  );
}
