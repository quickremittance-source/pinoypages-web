import type { Metadata } from "next";
import QRCode from "qrcode";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { ViewBeacon } from "@/components/ViewBeacon";
import { abs, events } from "@/lib/guide";

export const dynamicParams = false;
export function generateStaticParams() {
  return events.filter((e) => e.tier === "featured").map((e) => ({ id: e.id }));
}
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { id } = await params;
  return { title: events.find((e) => e.id === id)?.name, alternates: { canonical: `/calendar/${id}` } };
}

/** Featured events only: own page with description, QR + registration link; views and clicks counted. */
export default async function Page({ params }: P) {
  const { id } = await params;
  const e = events.find((x) => x.id === id && x.tier === "featured");
  if (!e) notFound();
  const svg = await QRCode.toString(abs(`/e/${e.id}`), { type: "svg", margin: 2, color: { dark: "#0B5E7A" } });
  return (
    <>
      <ViewBeacon id={e.id} />
      <PageHead kicker="Featured event" title={e.name} intro={e.description} />
      <div className="mx-auto grid max-w-3xl gap-6 px-4 py-8 sm:grid-cols-[1fr_160px]">
        <div className="space-y-2 rounded-2xl bg-white p-6">
          <p>
            <strong>When:</strong> {e.date} {e.time}
          </p>
          <p>
            <strong>Where:</strong> {e.place}
          </p>
          <p>
            <strong>Organizer:</strong> {e.organizer} · {e.contact}
          </p>
          <a className="btn" href={`/e/${e.id}`}>
            Register
          </a>
        </div>
        <div role="img" aria-label={`QR code to register for ${e.name}`} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </>
  );
}
