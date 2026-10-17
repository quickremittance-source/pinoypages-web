import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { HstTool } from "./HstTool";

export const metadata: Metadata = {
  title: "Do I need to register for HST?",
  alternates: { canonical: "/tools/hst-checker" },
};

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Free tool"
        page={5}
        title="Do I need to register for HST?"
        intro="Enter your sales for each of the last four calendar quarters. Based on CRA's $30,000 small-supplier rule."
      />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <HstTool />
        <p className="mt-6 text-sm">
          Source: Canada Revenue Agency, “When to register for and start charging the GST/HST”. General information only
          — confirm with a tax professional.
        </p>
      </div>
    </>
  );
}
