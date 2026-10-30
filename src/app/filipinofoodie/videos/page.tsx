import Link from "next/link";
import { AiBadge, DraftBadge, Empty, FF, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { getVideos } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta("Filipino Food Videos", "Filipino food videos from the GTA with AI reviews.", "/videos");

export default async function Videos() {
  const vs = await getVideos();
  return (
    <>
      <PageTitle title="Filipino food videos" />
      <ZcardSlot slot="videos-top" />
      {vs.length ? (
        <ul className="grid gap-4 sm:grid-cols-3">
          {vs.map((v) => (
            <li key={v.youtubeId} className="card overflow-hidden">
              <Link href={`${FF}/videos/${v.youtubeId}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={v.thumbnail ?? ""} alt="" loading="lazy" className="aspect-video w-full object-cover" />
                <p className="p-3 font-semibold text-sea">{v.title}</p>
              </Link>
              <p className="px-3 pb-3 text-xs text-muted">
                {v.channel}
                {v.aiReview ? (
                  <span className="ml-1">
                    <AiBadge /> review
                  </span>
                ) : null}
                {v.draft ? <DraftBadge /> : null}
              </p>
              <Link href={`${FF}/videos/${v.youtubeId}`} className="sr-only">
                {v.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Video reviews are being reviewed before publishing. Check back soon.</Empty>
      )}
    </>
  );
}
