import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { adsForRoute } from "@/lib/guide";

export const metadata: Metadata = { title: "2027 tax deadlines & checklist", alternates: { canonical: "/deadlines" } };

const deadlines = [
  { date: "Mon Mar 1, 2027", what: "RRSP contribution deadline for the 2026 tax year" },
  { date: "Mon Mar 15, 2027", what: "First quarterly tax instalment (if CRA asked you to pay instalments)" },
  {
    date: "Fri Apr 30, 2027",
    what: "File your 2026 return and pay any balance owing — everyone, including self-employed",
  },
  {
    date: "Tue Jun 15, 2027",
    what: "Filing deadline if you or your spouse are self-employed (payment was still due Apr 30)",
  },
  { date: "One month after each quarter", what: "Quarterly GST/HST return and payment, if you file quarterly" },
];
const checklist = [
  "T4 / T4A slips from every employer or client",
  "Receipts for business expenses, home office and vehicle log",
  "RRSP, childcare and medical receipts",
  "Rent or property tax receipts for the Ontario Trillium Benefit",
  "Foreign income or property details (e.g. property in the Philippines) — ask a pro about form T1135",
];

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Deadlines & checklist"
        page={6}
        title="2027 tax deadlines & checklist"
        intro="Key dates for the 2026 tax year. Source: Canada Revenue Agency."
      />
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-8 md:grid-cols-2">
        <section aria-labelledby="dl">
          <h2 id="dl" className="text-2xl font-semibold text-sea">
            Deadlines
          </h2>
          <ul className="mt-3 space-y-2">
            {deadlines.map((d) => (
              <li key={d.what} className="rounded-lg bg-white p-3">
                <strong className="text-coral-dk">{d.date}</strong> — {d.what}
              </li>
            ))}
          </ul>
        </section>
        <section aria-labelledby="cl">
          <h2 id="cl" className="text-2xl font-semibold text-sea">
            Bring to your tax preparer
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5">
            {checklist.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </section>
      </div>
      <AdGrid ads={adsForRoute("/deadlines")} />
    </>
  );
}
