import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { GetVerified } from "@/components/GetVerified";
import { brand, listings } from "@/lib/guide";
import { publicListings } from "@/lib/public";

export const metadata: Metadata = { title: "Get Verified", alternates: { canonical: "/upgrade" } };

/** Print page 19 target (QR in the edition). Same content as /get-verified. */
export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing) ?? publicListings.find((x) => x.id === listing);
  return (
    <>
      <PageHead
        page={19}
        kicker="For listed businesses"
        title="Get Verified"
        intro="Your free listing stays free. Claim it to fix your details, or get Verified: your own ZCard bridge page, a QR that sends people to it, and a monthly scan count."
      >
        <p className="mt-3 max-w-2xl font-semibold text-ink">{brand.pitch}</p>
      </PageHead>
      <GetVerified l={l} />
    </>
  );
}
