import type { Metadata } from "next";
import { PageHead } from "@/components/Chrome";
import { GetVerified } from "@/components/GetVerified";
import { brand, listings } from "@/lib/guide";
import { publicListings } from "@/lib/public";

export const metadata: Metadata = { title: "Get Verified", alternates: { canonical: "/get-verified" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing) ?? publicListings.find((x) => x.id === listing);
  return (
    <>
      <PageHead
        kicker={`For kabayan businesses · ${brand.pilotLabel}`}
        title="Be the kabayan they can trust"
        intro="Get Verified for $99 one-time + HST, everything included: the Verified Kabayan badge (earned, never bought), your ZCard, a QR for everything you print, and a monthly scan report that shows people found you."
      />
      <GetVerified l={l} />
    </>
  );
}
