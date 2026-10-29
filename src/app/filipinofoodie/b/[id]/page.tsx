import Link from "next/link";
import { notFound } from "next/navigation";
import { FF } from "@/components/foodie/ui";

/** zcard landing pages. No active Verified++ zcards yet, so only the clearly labelled sample layout exists. */
export const dynamicParams = false;
export const generateStaticParams = () => [{ id: "sample" }];
export const metadata = { title: "zcard sample layout | Filipino Foodie", robots: { index: false } };

export default async function ZcardLanding({ params }: { params: Promise<{ id: string }> }) {
  if ((await params).id !== "sample") notFound();
  return (
    <div className="py-6">
      <p className="mb-4 rounded bg-sunset/30 p-3 text-sm font-semibold">
        Sample layout only. This is not a real business. It shows what a zcard landing page will look like.
      </p>
      <div data-slot="zcard-landing-header" className="card p-6">
        <p className="text-[11px] font-bold tracking-wider text-muted uppercase">Sponsored · zcard</p>
        <h1 className="text-3xl font-bold text-sea">Sample Business Name</h1>
        <p className="text-muted">Tagline goes here · Area, GTA</p>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {["Menu (owner-confirmed prices)", "Photos", "Specials", "Hours", "Pre-order"].map((s) => (
          <section key={s} className="card p-4">
            <h2 className="font-bold">{s}</h2>
            <p className="text-sm text-muted">Placeholder.</p>
          </section>
        ))}
      </div>
      <p className="mt-4 text-sm">
        Want one?{" "}
        <Link className="text-turqdk underline" href={`${FF}/claim`}>
          See zcard options
        </Link>
        . Digital card by ZCard.
      </p>
    </div>
  );
}
