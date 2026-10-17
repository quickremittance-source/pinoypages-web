import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { CppTool } from "./CppTool";

export const metadata: Metadata = { title: "Self-employed CPP estimator", alternates: { canonical: "/tools/cpp" } };

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Free tool"
        page={5}
        title="Self-employed CPP estimator"
        intro="Self-employed people pay both halves of CPP. Enter your 2026 net business income (after expenses)."
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <CppTool />
        <p className="mt-6 text-sm">
          2026 rates: 11.9% on earnings between $3,500 and $74,600 (max $8,460.90), plus 8% CPP2 between $74,600 and
          $85,000 (max $832). Source: Canada Revenue Agency. Estimate only — income tax not included.
        </p>
      </div>
    </>
  );
}
