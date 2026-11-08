import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHead } from "@/components/Chrome";

export const metadata: Metadata = {
  title: "zcard digital ads",
  description: "The optional standard photo landing-page upgrade for Pinoy Pages businesses.",
  alternates: { canonical: "/zcard" },
};

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Powered by zcard digital ads"
        title="zcard: a photo landing page for your business"
        intro="Ask about the optional standard ad landing page with one photo, your business name, a short description, services and contact buttons. Price on enquiry."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section className="grid items-center gap-8 md:grid-cols-2" aria-label="About zcard">
          <Image src="/zcard/zcard-logo.webp" alt="zcard digital ads logo" width={800} height={600} className="w-full rounded-2xl" priority />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">One standard photo landing page</h2>
            <p>This optional upgrade gives your business a dedicated page on pinoypages.ca. It is separate from membership and verification.</p>
            <p>For pages with a Pinoy Pages QR code, scans are counted. Scan counts are not the same as contact-button clicks, and no number of leads, calls or sales is guaranteed.</p>
            <p className="text-sm text-muted">Membership card and listing QR inclusion in the membership package is still to be confirmed.</p>
          </div>
        </section>
        <section aria-labelledby="price-h" data-testid="zcard-pricing">
          <h2 id="price-h" className="text-2xl font-bold text-ink">Foundation Edition options</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="card border-2 border-green-600 p-6">
              <h3 className="text-xl font-extrabold text-ink">Membership and verification</h3>
              <p className="mt-2 text-3xl font-extrabold text-green-700" data-testid="verified-price">$199 for the Foundation Edition</p>
              <p className="mt-2 text-sm">A six-month pilot limited to 100 memberships. The identity-only badge is earned through a ~15-minute live video check, never bought. No HST is charged.</p>
              <Link className="btn mt-4 inline-block" href="/get-verified">Membership details</Link>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-extrabold text-ink">Standard ad landing page with one photo</h3>
              <p className="mt-2 text-3xl font-extrabold text-phred">Price on enquiry</p>
              <p className="mt-2 text-sm">The only optional paid upgrade at launch. No print-ad sizes or sponsored-placement packages are offered for the Foundation launch.</p>
              <Link className="btn mt-4 inline-block" href="/advertise?product=landing-photo#enquire">Ask about a landing page</Link>
            </div>
          </div>
        </section>
        <section className="rounded-2xl bg-sand p-6" aria-labelledby="edition-h">
          <h2 id="edition-h" className="text-xl font-bold text-ink">After the Foundation Edition</h2>
          <p className="mt-3">Future editions run for one year. Ended editions are archived and remain available to view.</p>
          <p className="mt-3">Once 100 memberships are confirmed, the printed Foundation directory will be released and mailed to businesses. Print date and quantity are to be confirmed.</p>
        </section>
      </div>
    </>
  );
}
