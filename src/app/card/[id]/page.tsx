import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ViewBeacon } from "@/components/ViewBeacon";
import { ZCardBridge } from "@/components/ZCardBridge";
import { isPaid, listings } from "@/lib/guide";

export const dynamicParams = false;
/** One ZCard bridge page per Verified listing. Free listings have none. */
export function generateStaticParams() {
  return listings.filter(isPaid).map((l) => ({ id: l.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  const l = listings.find((x) => x.id === id);
  return { title: l ? `${l.zcard?.person ?? l.name} · ZCard` : "ZCard", alternates: { canonical: `/card/${id}` } };
}

/** Mobile-first landing page for QR scans. No login, no payment, no personal info: Save contact and Call only. */
export default async function Page({ params }: P) {
  const { id } = await params;
  const l = listings.find((x) => x.id === id && isPaid(x));
  if (!l) notFound();
  return (
    <div className="pinstripe-bg min-h-[70vh] bg-aqua/50 px-3 py-5 sm:py-10">
      <ViewBeacon id={l.id} />
      <div className="mx-auto max-w-md">
        <ZCardBridge l={l} standalone />
        <p className="mt-4 text-center text-sm">
          <Link href={`/listing/${l.id}`} className="font-semibold text-turqdk underline">
            See the full listing on Pinoy Pages
          </Link>
        </p>
      </div>
    </div>
  );
}
