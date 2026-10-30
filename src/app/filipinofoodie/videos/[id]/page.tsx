import Link from "next/link";
import { notFound } from "next/navigation";
import { AiBadge, DraftBadge, FF, ScoreBars, ZcardSlot } from "@/components/foodie/ui";
import { VideoFacade } from "@/components/foodie/client";
import { getVideos } from "@/lib/foodie/data";
import { ffMeta } from "../../meta";

export const revalidate = 86400;
export const generateStaticParams = async () => (await getVideos()).map((v) => ({ id: v.youtubeId }));
type P = { params: Promise<{ id: string }> };
export async function generateMetadata({ params }: P) {
  const { id } = await params;
  const v = (await getVideos()).find((x) => x.youtubeId === id);
  return v ? ffMeta(v.title, `${v.title}: Filipino food video with an AI review.`, `/videos/${id}`) : {};
}

export default async function VideoPage({ params }: P) {
  const { id } = await params;
  const v = (await getVideos()).find((x) => x.youtubeId === id);
  if (!v) notFound();
  return (
    <div className="grid gap-6 py-6 md:grid-cols-[2fr_1fr]">
      <div>
        <h1 className="mb-3 text-2xl font-bold text-sea">
          {v.title}
          {v.draft ? <DraftBadge /> : null}
        </h1>
        <VideoFacade id={v.youtubeId} title={v.title} thumb={v.thumbnail ?? ""} />
        {v.channel ? <p className="mt-2 text-sm text-muted">Channel: {v.channel}</p> : null}
        {v.aiReview ? (
          <section className="card mt-4 p-4">
            <h2 className="mb-2 flex items-center gap-2 font-bold">
              <AiBadge /> AI review
            </h2>
            <p>{v.aiReview}</p>
            {v.scores ? (
              <div className="mt-3">
                <ScoreBars scores={v.scores} />
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted">{v.aiLabel ?? "AI-generated from the video title and metadata."}</p>
          </section>
        ) : null}
        {v.dishSlug ? (
          <Link href={`${FF}/dish/${v.dishSlug}`} className="btn mt-4">
            Find {v.dish} near me
          </Link>
        ) : null}
      </div>
      <ZcardSlot slot="video-sidebar" size="sidebar" />
    </div>
  );
}
