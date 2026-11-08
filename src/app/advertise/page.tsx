import Link from "next/link";
import type { Metadata } from "next";
import { MagazineHero } from "@/components/MagazineHero";
import { AdvertiseTabs } from "@/components/AdvertiseTabs";
import { InquiryForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { brand } from "@/lib/guide";

export const metadata: Metadata = { title: "Community", alternates: { canonical: "/advertise" } };

/** Launch offers (Jose, Nov 7): membership and verification, plus one optional standard photo landing page. */
const PRODUCTS = ["verified", "landing-photo"] as const;
/** Old ?size= links (print ad sizes) still open the page; print ads are not sold during the Foundation Edition. */
const fromQuery = (v?: string) => (PRODUCTS as readonly string[]).includes(v ?? "") ? v : v === "landing" ? "landing-photo" : undefined;

export default async function Page({ searchParams }: { searchParams: Promise<{ product?: string; size?: string }> }) {
  const { product, size } = await searchParams;
  const chosen = fromQuery(product) ?? fromQuery(size);
  const mail = `mailto:${brand.email}?subject=${encodeURIComponent("Community enquiry · Pinoy Pages Foundation Edition")}`;
  return (
    <>
      <MagazineHero kicker="Community" title="Community" intro="Join the community and get verified" />
      <AdvertiseTabs current="/advertise" />
      <section aria-labelledby="ways-h" className="mx-auto mt-4 max-w-5xl px-4" data-testid="ways">
        <h2 id="ways-h" className="sr-only">
          Ways to join
        </h2>
        <ul className="grid gap-3 sm:grid-cols-3">
          <li className="card p-4" data-offer="free">
            <strong className="block text-ink">Free listing</strong>
            <span className="text-sm text-muted">Your business name and contact details in the directory.</span>{" "}
            <Link href="/list-free" className="text-sm font-semibold text-turqdk underline">
              List free
            </Link>
          </li>
          <li className="card p-4" data-offer="verified">
            <strong className="block text-ink">Membership and verification</strong>
            <span className="text-sm text-muted">
              $199 for the Foundation Edition: a standout (bold, highlighted) listing, free listing updates and the green
              Kabayan Verified badge once you pass a live identity check (about 15 minutes). The badge is never bought.
            </span>{" "}
            <Link href="/get-verified" className="text-sm font-semibold text-turqdk underline">
              Get Verified
            </Link>
          </li>
          <li className="card p-4" data-offer="landing-photo" data-testid="landing-upgrade">
            <strong className="block text-ink">Standard ad landing page with photo</strong>
            <span className="text-sm text-muted">
              Optional upgrade: one page on Pinoy Pages with one photo, your business name, a short description, services
              and contact buttons. Price on enquiry.
            </span>{" "}
            <Link href="/advertise?product=landing-photo#enquire" className="text-sm font-semibold text-turqdk underline">
              Ask about a landing page
            </Link>
          </li>
        </ul>
      </section>
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section aria-labelledby="edition-h" className="grid gap-6 md:grid-cols-2" data-testid="edition-terms">
          <div className="rounded-2xl bg-aqua/60 p-6">
            <h2 id="edition-h" className="text-xl font-bold text-ink">
              Foundation Edition
            </h2>
            <p className="mt-3">
              The Foundation Edition is a six-month pilot, limited to 100 memberships at $199 for the issue. Future
              editions run for one year. After each edition ends, it is archived and remains available to view.
            </p>
          </div>
          <div className="rounded-2xl bg-sand p-6">
            <h2 className="text-xl font-bold text-ink">Printed directory</h2>
            <p className="mt-3" data-testid="print-milestone">
              The printed directory is released after 100 memberships are confirmed, and is mailed to businesses. We will
              confirm the date when we reach that milestone.
            </p>
            <p className="mt-3 text-sm text-muted">
              We count QR scans for listings that have a Pinoy Pages QR code. We do not guarantee results.
            </p>
          </div>
        </section>

        <section aria-labelledby="enquire-h" id="enquire" className="scroll-mt-24">
          <h2 id="enquire-h" className="mb-3 text-2xl font-bold text-ink">
            Join or ask a question
          </h2>
          <p className="mb-4 text-muted">
            This form only sends us your details. We never take payment or ask for card details on this site; we send an
            invoice after confirming with you. Prefer email?{" "}
            <a className="font-semibold text-turqdk underline" href={mail}>
              {brand.email}
            </a>
          </p>
          <InquiryForm size={chosen} />
        </section>

        <section aria-labelledby="verified-h" className="space-y-4">
          <h2 id="verified-h" className="text-2xl font-bold text-ink">
            Membership and verification — $199 for the Foundation Edition
          </h2>
          <p className="rounded-xl bg-sand p-4">
            {brand.badgeRule} Verification confirms identity only; results are not guaranteed.
          </p>
          <PlanTable />
        </section>
      </div>
    </>
  );
}
