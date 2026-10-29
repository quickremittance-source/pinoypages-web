import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { track } from "@/lib/analytics/track";
import { AdBeacon } from "@/components/AdBeacon";
import { getAd } from "@/lib/adsRepo";
import { adStatId, listingTarget, mapsUrl, VERIFIED_LABEL } from "@/lib/adLanding";
import { sectionRobots } from "@/lib/seo";

// zcard business-card landing pages: a separate section, not browsable from the directory,
// but reachable by QR, site search and (once SECTION_INDEXING.zcard is on) search engines.
export const dynamic = "force-dynamic";
type P = { params: Promise<{ slug: string }>; searchParams: Promise<{ src?: string; t?: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAd(slug);
  if (!a || a.tier !== "zcard") return { title: "zcard", robots: { index: false, follow: false } };
  return {
    title: `${a.name} · zcard`,
    description: a.tagline || undefined,
    robots: sectionRobots("zcard"),
    alternates: { canonical: `/zcard/${slug}` },
  };
}

export default async function Page({ params, searchParams }: P) {
  const { slug } = await params;
  const { src, t } = await searchParams;
  const a = await getAd(slug);
  if (!a || a.tier !== "zcard") notFound();
  const ua = (await headers()).get("user-agent") ?? "";
  const fromQr = src === "qr";
  await track(adStatId(a.slug), fromQr ? "scan" : "view", ua);
  if (fromQr && t && t === a.trackingId) await track(`${adStatId(a.slug)}:${t}`, "scan", ua);
  return (
    <div className="mx-auto max-w-md space-y-5 px-4 py-8" data-testid="zcard-landing">
      <AdBeacon id={adStatId(a.slug)} />
      {a.demo && (
        <p className="rounded-lg bg-sand p-2 text-center text-xs font-bold text-ink">Sample zcard for illustration</p>
      )}
      <div className="card space-y-3 p-6">
        <h1 className="text-2xl font-extrabold text-ink">{a.name}</h1>
        {a.verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-700 px-2.5 py-0.5 text-xs font-bold text-white">
            <span aria-hidden="true">✅</span> {VERIFIED_LABEL[a.verified]}
          </span>
        )}
        {a.tagline && <p className="text-muted">{a.tagline}</p>}
        {a.services.length > 0 && (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {a.services.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        <div className="grid gap-2">
          <a className="btn text-center" href={mapsUrl(a.mapQuery)} rel="noopener" target="_blank">
            Directions
          </a>
          {a.website && (
            <a className="btn btn-teal text-center" href={a.website} rel="noopener" target="_blank">
              Website
            </a>
          )}
          {a.listingId && (
            <Link className="text-center text-sm font-semibold text-turqdk underline" href={listingTarget(a)}>
              See the directory listing
            </Link>
          )}
        </div>
      </div>
      <p className="text-center text-xs text-muted">
        Powered by{" "}
        <Link href="/zcard" className="underline">
          zcard digital ads
        </Link>
      </p>
    </div>
  );
}
