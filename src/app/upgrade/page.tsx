import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { AdGrid } from "@/components/AdCard";
import { ClaimForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { QrSection } from "@/components/QrSection";
import { adsForRoute, brand, listings } from "@/lib/guide";

export const metadata: Metadata = { title: "Claim or upgrade your listing", alternates: { canonical: "/upgrade" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing);
  return (
    <>
      <PageHead
        page={19}
        kicker="For listed businesses"
        title={`Get listed in ${brand.editionName}`}
        intro="Your free listing stays free. Claim it to fix your details, or get Verified: your own ZCard bridge page, a QR that sends people to it, and a monthly scan count."
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <section className="rounded-2xl border-2 border-sunset bg-sand p-6" aria-labelledby="qrpitch">
          <h2 id="qrpitch" className="text-2xl font-semibold text-sea">
            Your page on Pinoy Pages, with a QR that sends people to it
          </h2>
          <p className="mt-2 font-bold">{brand.pitch}</p>
          <p className="mt-2">
            {brand.productNote} Two choices: Free (name and contact only, unverified), or Verified ($199 per issue,
            everything included: dynamic QR, ZCard with Save contact, featured spot, counter card, monthly scan report,
            mutual partner stars). Free listings have no badge, QR, Save contact or ZCard, and can&apos;t give or
            receive vouches.
          </p>
        </section>
        <PlanTable />
        <section aria-labelledby="claimh">
          <h2 id="claimh" className="mb-3 text-2xl font-semibold text-sea">
            Claim your listing
          </h2>
          <ClaimForm listing={l?.id} listingName={l?.name} />
        </section>
        {l && <QrSection l={l} />}
      </div>
      <AdGrid ads={adsForRoute("/upgrade")} />
    </>
  );
}
