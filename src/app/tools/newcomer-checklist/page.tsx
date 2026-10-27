import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { NEWCOMER_COPY, bi } from "@/lib/newcomer";
import { ChecklistTool } from "./ChecklistTool";

export const metadata: Metadata = {
  title: "90-day newcomer checklist · 90-araw na checklist",
  description: NEWCOMER_COPY.intro.en,
  alternates: { canonical: "/tools/newcomer-checklist" },
};

export default function Page() {
  return (
    <>
      <PageHead kicker={bi(NEWCOMER_COPY.kicker)} title={NEWCOMER_COPY.title.en} intro={NEWCOMER_COPY.intro.en}>
        <p className="mt-2 text-muted">{NEWCOMER_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{NEWCOMER_COPY.intro.tl}</p>
      </PageHead>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <ChecklistTool />
      </div>
    </>
  );
}
