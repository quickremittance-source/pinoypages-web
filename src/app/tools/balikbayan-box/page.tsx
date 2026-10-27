import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { BALIKBAYAN_COPY, bi } from "@/lib/balikbayan";
import { BalikbayanTool } from "./BalikbayanTool";

export const metadata: Metadata = {
  title: "Balikbayan box carriers · Mga carrier ng balikbayan box",
  description: BALIKBAYAN_COPY.intro.en,
  alternates: { canonical: "/tools/balikbayan-box" },
};

export default function Page() {
  return (
    <>
      <PageHead kicker={bi(BALIKBAYAN_COPY.kicker)} title={BALIKBAYAN_COPY.title.en} intro={BALIKBAYAN_COPY.intro.en}>
        <p className="mt-2 text-muted">{BALIKBAYAN_COPY.title.tl}</p>
        <p className="mt-1 text-sm text-muted">{BALIKBAYAN_COPY.intro.tl}</p>
      </PageHead>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <BalikbayanTool />
      </div>
    </>
  );
}
