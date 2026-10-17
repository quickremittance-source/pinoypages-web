import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { InquiryForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { adsForRoute, ads } from "@/lib/guide";

export const metadata: Metadata = { title: "Advertise", alternates: { canonical: "/advertise" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ slot?: string }> }) {
  const { slot } = await searchParams;
  const valid = ads.find((a) => a.id === slot)?.id;
  const open = ads.filter((a) => a.status !== "sold").length;
  return (
    <>
      <PageHead
        kicker="Advertise"
        page={19}
        title="Advertise in the guide"
        intro={`${open} of ${ads.length} ad spaces open. Every ad runs in print and on the matching web page.`}
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <p className="rounded-xl bg-sand p-4">
          Every Featured listing and ad includes the <strong>QR Kit</strong>: a branded QR for your cards, brochures,
          flyers, storefront signs and vehicle decals, with a monthly scan count. Not ready for an ad? The QR Kit alone
          is $99/yr ($79 founding).
        </p>
        <PlanTable />
        <section aria-labelledby="inq">
          <h2 id="inq" className="mb-3 text-2xl font-semibold text-sea">
            Ask about an ad{valid ? ` (space ${valid})` : ""}
          </h2>
          <InquiryForm slot={valid} />
        </section>
      </div>
      <AdGrid ads={adsForRoute("/advertise")} />
    </>
  );
}
