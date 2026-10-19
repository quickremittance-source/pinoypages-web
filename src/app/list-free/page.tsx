import type { Metadata } from "next";
import Link from "next/link";
import { PageHead } from "@/components/Chrome";
import { ListFreeForm } from "@/components/Forms";
import { adMenu, categories, money } from "@/lib/guide";

export const metadata: Metadata = { title: "List your business free", alternates: { canonical: "/list-free" } };
const verified = adMenu.find((o) => o.id === "verified")!;

export default async function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const { listing } = await searchParams;
  return (
    <>
      <PageHead
        kicker="For Filipino-owned businesses in the GTA"
        title="List your business free"
        intro="A free listing puts your business name, phone and city in the directory. It is unverified and stays free for as long as you want it."
      />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1.3fr_1fr]">
        <section aria-labelledby="form-h">
          <h2 id="form-h" className="mb-3 text-2xl font-bold text-ink">
            Your details
          </h2>
          <ListFreeForm subs={categories.map((c) => ({ value: c.slug, label: c.name }))} listing={listing} />
        </section>
        <aside className="space-y-4" aria-label="Free and Verified">
          <section className="card p-5" data-testid="free-includes">
            <h2 className="font-bold text-ink">What a free listing includes</h2>
            <p className="mt-2 text-sm text-muted">
              One line in the directory with your business name, phone and city. No badge, logo, QR code or ZCard. We
              check that the phone number works before it appears.
            </p>
          </section>
          <section className="card border-2 border-phred p-5" data-testid="upsell-verified">
            <p className="kicker">When you are ready</p>
            <h2 className="mt-1 text-xl font-bold text-ink">
              Get Verified · {money(verified.price)} {verified.unit}
            </h2>
            <p className="mt-2 text-sm">
              A featured card with your logo and services, the Verified Kabayan badge once you pass the visit and a
              mutual vouch, a ZCard with Save contact, a QR code for everything you print, and a monthly scan report.
            </p>
            <Link href={`/get-verified${listing ? `?listing=${listing}` : ""}`} className="btn mt-4">
              See how Verified works
            </Link>
          </section>
          <p className="text-xs text-muted">
            Already listed? Find your business in the{" "}
            <Link href="/directory" className="font-semibold text-turqdk underline">
              directory
            </Link>{" "}
            and use “Claim it free” to correct your details.
          </p>
        </aside>
      </div>
    </>
  );
}
