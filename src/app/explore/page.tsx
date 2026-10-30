import Image from "next/image";
import Link from "next/link";
import { VideoCard } from "@/components/explorer/ui";
import { BE, TOPICS, getVideos } from "@/lib/explorer/data";
import { beMeta } from "./meta";

export const metadata = beMeta(
  "Travel, Remittance & Balikbayan Boxes for GTA Filipinos",
  "Curated videos on trips home to the Philippines, sending money from Canada and shipping balikbayan boxes from the GTA.",
  "",
);

export default function ExploreHome() {
  return (
    <>
      <header className="flex flex-col items-start gap-4 py-6 sm:flex-row sm:items-center">
        <Image
          src="/brand/balikbayan-explorer.jpg"
          alt="Balikbayan Explorer"
          width={480}
          height={360}
          priority
          className="h-28 w-auto rounded-lg"
        />
        <div>
          <h1 className="text-3xl font-bold text-sea">Balikbayan Explorer</h1>
          <p className="mt-1 text-muted">
            Travel home, send money and ship padala from the Greater Toronto Area. A curated video guide in draft.
          </p>
        </div>
      </header>
      {TOPICS.map((t) => {
        const vs = getVideos(t.slug).slice(0, 3);
        return (
          <section key={t.slug} className="mt-8">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-xl font-bold text-sea">{t.label}</h2>
              <Link href={`${BE}/${t.slug}`} className="text-sm font-semibold underline">
                All {t.label.toLowerCase()} videos
              </Link>
            </div>
            <p className="mb-3 text-sm text-muted">{t.intro}</p>
            <ul className="grid gap-4 sm:grid-cols-3">
              {vs.map((v) => (
                <VideoCard key={v.youtubeId} v={v} />
              ))}
            </ul>
          </section>
        );
      })}
      <section className="card mt-10 p-5">
        <h2 className="text-lg font-bold text-sea">Travel, remittance or cargo business in the GTA?</h2>
        <p className="mt-1 text-sm">
          List free on Pinoy Pages. Kabayan Verified is $99/yr + HST. Featured placements in Balikbayan Explorer: Rates
          on request.
        </p>
        <p className="mt-3 flex gap-3 text-sm font-semibold">
          <Link href="/list-free" className="underline">
            List free
          </Link>
          <Link href="/get-verified" className="underline">
            Get verified
          </Link>
          <Link href="/advertise" className="underline">
            Advertise
          </Link>
        </p>
      </section>
    </>
  );
}
