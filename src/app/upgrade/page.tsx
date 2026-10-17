import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { ClaimForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { QrSection, QR_USES } from "@/components/QrSection";
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
        <section className="rounded-2xl border-2 border-sunset bg-sand p-6" aria-labelledby="qrpitch">
          <h2 id="qrpitch" className="text-2xl font-semibold text-sea">
            Your own QR code — free with every listing
          </h2>
          <p className="mt-2">
            Get {QR_USES}. It always points to your up-to-date listing, so you never reprint when your phone or hours
            change. Free listings get a basic QR. Featured listings and ads get a branded QR, print-ready PNG, SVG and
            PDF files, and a monthly scan report.
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
    </>
  );
}
