import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { PageHead } from "@/components/Chrome";
import { ZCARD_SCARCITY_NOTE } from "@/lib/zcard";

export const metadata: Metadata = {
  title: "zcard digital ads",
  description: "zcard: a QR-enabled digital ad landing page for your print ad or business card.",
  alternates: { canonical: "/zcard" },
};

const STEPS = [
  {
    t: "Your print ad carries a QR code",
    d: "Every eligible ad or business card gets its own QR code, printed with your artwork.",
  },
  {
    t: "Customers scan it",
    d: "The code opens a mobile landing page for your business at pinoypages.ca/zcard/…, built to load fast on any phone.",
  },
  {
    t: "Every scan is counted",
    d: "Scans, page views and clicks are tracked without storing personal data or IP addresses.",
  },
  {
    t: "You see the results",
    d: "You get a private stats link showing your views, scans and clicks by month.",
  },
];

const SIZES = [
  { n: "Full page ad", q: "Own QR landing page", r: "Rates on request" },
  { n: "Half page ad", q: "Own QR landing page", r: "Rates on request" },
  { n: "Quarter page ad", q: "QR opens your directory listing (scan counted)", r: "Rates on request" },
  { n: "Business card ad", q: "QR included with Kabayan Verified++ only", r: "Rates on request" },
];

export default function Page() {
  return (
    <>
      <PageHead
        kicker="Powered by zcard digital ads"
        title="zcard: your QR-enabled digital ad landing page"
        intro="Turn a printed ad into a measurable one. A zcard links your print ad or business card to a mobile landing page, and shows you how many people scanned it. zcard is available to businesses anywhere, not only in the GTA."
      />
      <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
        <section className="grid items-center gap-8 md:grid-cols-2" aria-label="About zcard">
          <Image
            src="/zcard/zcard-logo.webp"
            alt="zcard digital ads logo"
            width={800}
            height={600}
            className="w-full rounded-2xl"
            priority
          />
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-ink">What is a zcard?</h2>
            <p>
              A zcard is a digital ad landing page connected to a QR code on your printed advertising. When a customer
              scans the code, they land on a mobile page for your business instead of a generic website, and the scan is
              recorded so you can see that your print ad is working.
            </p>
            <p>
              zcard is shared across the Pinoy Pages family of sites, so one zcard can serve your business wherever
              kabayan customers find you.
            </p>
            <p className="text-sm text-muted">
              Save-contact and click-to-call buttons are planned for a later release.
            </p>
          </div>
        </section>

        <section aria-labelledby="two-h" className="grid gap-5 md:grid-cols-2" data-testid="zcard-two-parts">
          <h2 id="two-h" className="sr-only">
            Two parts of zcard
          </h2>
          <div className="card p-6">
            <h3 className="text-xl font-extrabold text-ink">1. Strategic ad spaces on pinoypages.ca</h3>
            <p className="mt-2 text-sm">
              A small number of zcard ad spaces placed across pinoypages.ca where visitors look for kabayan businesses.
            </p>
          </div>
          <div className="card p-6">
            <h3 className="text-xl font-extrabold text-ink">2. Your own business card landing page</h3>
            <p className="mt-2 text-sm">
              A page at pinoypages.ca/zcard/your-business. It is a separate section, not part of the directory listings,
              but people can find it through the site search, and it is ready for Google once search indexing is turned
              on.
            </p>
          </div>
        </section>

        <section aria-labelledby="how-h">
          <h2 id="how-h" className="text-2xl font-bold text-ink">
            How it works
          </h2>
          <ol className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="zcard-steps">
            {STEPS.map((s, i) => (
              <li key={s.t} className="card p-5">
                <p className="text-sm font-bold text-phred">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-extrabold text-ink">{s.t}</h3>
                <p className="mt-2 text-sm text-muted">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="price-h" data-testid="zcard-pricing">
          <h2 id="price-h" className="text-2xl font-bold text-ink">
            Pricing
          </h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <div className="card border-2 border-green-600 p-6">
              <h3 className="text-xl font-extrabold text-ink">✅ Kabayan Verified</h3>
              <p className="mt-2 text-3xl font-extrabold text-green-700" data-testid="verified-price">
                $99 per year + HST
              </p>
              <p className="mt-2 text-sm">
                The green Kabayan Verified badge on your directory listing, earned through verification.
              </p>
              <Link className="btn mt-4 inline-block" href="/get-verified">
                Get Verified
              </Link>
            </div>
            <div className="card p-6">
              <h3 className="text-xl font-extrabold text-ink">Kabayan Verified++</h3>
              <p className="mt-2 text-3xl font-extrabold text-phred">Rates on request</p>
              <p className="mt-2 text-sm">
                Everything in Kabayan Verified, plus a QR code and a business card zcard bundle.
              </p>
              <Link className="btn mt-4 inline-block" href="/advertise#enquire">
                Ask about Verified++
              </Link>
            </div>
          </div>
          <div className="card mt-5 p-6" data-testid="sponsored-pricing">
            <h3 className="text-xl font-extrabold text-ink">Sponsored search placement</h3>
            <p className="mt-2 text-3xl font-extrabold text-phred">Rates on request</p>
            <p className="mt-2 text-sm">
              Appear at the top of matching Pinoy Pages search results for your chosen keywords or categories, clearly
              labelled “Sponsored”. Only a few Sponsored spots are shown per search, and impressions and clicks appear
              in your private stats.
            </p>
          </div>
          <p className="mt-6 rounded-xl bg-aqua/60 p-4 font-semibold" data-testid="zcard-limited">
            {ZCARD_SCARCITY_NOTE}
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-left text-sm" data-testid="zcard-sizes">
              <thead>
                <tr className="border-b">
                  <th className="py-2 pr-4">Ad size</th>
                  <th className="py-2 pr-4">QR code</th>
                  <th className="py-2">Price</th>
                </tr>
              </thead>
              <tbody>
                {SIZES.map((s) => (
                  <tr key={s.n} className="border-b">
                    <td className="py-2 pr-4 font-semibold">{s.n}</td>
                    <td className="py-2 pr-4">{s.q}</td>
                    <td className="py-2 font-bold text-phred">{s.r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid items-center gap-8 rounded-2xl bg-sand p-6 md:grid-cols-2" aria-labelledby="order-h">
          <div className="space-y-3">
            <h2 id="order-h" className="text-2xl font-bold text-ink">
              Scan to order yours
            </h2>
            <p>
              Tell us about your business and the ad you have in mind, and we will send you the current rates. We never
              take payment on this site; we invoice after confirming your order in writing.
            </p>
            <Link className="btn inline-block" href="/advertise#enquire">
              Order a zcard
            </Link>
          </div>
          <Image
            src="/zcard/zcard-card.webp"
            alt="zcard card with a QR code to pinoypages.ca/zcard and the words Scan to order yours"
            width={600}
            height={943}
            className="mx-auto w-full max-w-xs rounded-xl"
          />
        </section>
      </div>
    </>
  );
}
