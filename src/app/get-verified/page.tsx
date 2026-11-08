import type { Metadata } from "next";
import { MagazineHero } from "@/components/MagazineHero";
import { AdvertiseTabs } from "@/components/AdvertiseTabs";
import { GetVerified } from "@/components/GetVerified";
import { brand, listings } from "@/lib/guide";
import { publicListings } from "@/lib/public";

export const metadata: Metadata = { title: "Get Verified", alternates: { canonical: "/get-verified" } };

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  const l = listings.find((x) => x.id === listing) ?? publicListings.find((x) => x.id === listing);
  return (
    <>
      <MagazineHero
        kicker={`For kabayan businesses · ${brand.pilotLabel}`}
        title="Be the kabayan they can trust"
        intro="Membership and verification is $199 CAD for the Foundation Edition, a six-month pilot limited to 100 memberships. The identity-only badge is earned through a live video check, never bought. Ask about the optional standard landing page with one photo; pricing is to be confirmed."
      />
      <AdvertiseTabs current="/get-verified" />
      <GetVerified l={l} />
    </>
  );
}
