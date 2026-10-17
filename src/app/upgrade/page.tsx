import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { ClaimForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { listings } from "@/lib/guide";

export const metadata: Metadata = { title: "Claim or upgrade your listing", alternates: { canonical: "/upgrade" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing);
  return (
    <>
      <PageHead
        kicker="For listed businesses"
        title="Claim or upgrade your listing"
        intro="Your free listing stays free. Claim it to fix details and get a proof of your page — or upgrade to stand out in print and online."
      />
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8">
        <PlanTable />
        <section aria-labelledby="claimh">
          <h2 id="claimh" className="mb-3 text-2xl font-semibold text-sea">
            Claim your listing
          </h2>
          <ClaimForm listing={l?.id} listingName={l?.name} />
        </section>
      </div>
    </>
  );
}
