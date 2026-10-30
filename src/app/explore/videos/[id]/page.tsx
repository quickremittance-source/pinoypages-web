import Link from "next/link";
import { notFound } from "next/navigation";
import { AiBadge, DraftBadge } from "@/components/explorer/ui";
import { BE, TOPICS, getVideo, getVideos } from "@/lib/explorer/data";
import { beMeta } from "../../meta";

export const dynamicParams = false;
export const generateStaticParams = () => getVideos().map((v) => ({ id: v.youtubeId }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const v = getVideo((await params).id);
  return v ? beMeta(v.title, v.blurb, `/videos/${v.youtubeId}`) : {};
}

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const v = getVideo((await params).id);
  if (!v) notFound();
  const t = TOPICS.find((x) => x.slug === v.topic)!;
  return (
    <article className="mt-6">
      <p className="text-sm">
        <Link href={`${BE}/${t.slug}`} className="underline">
          {t.label}
        </Link>
        {v.status === "draft" ? <DraftBadge /> : null}
      </p>
      <h1 className="mt-2 text-2xl font-bold text-sea">{v.title}</h1>
      <p className="text-sm text-muted">
        Channel:{" "}
        <a href={v.channelUrl} rel="noopener noreferrer nofollow" target="_blank" className="underline">
          {v.channel}
        </a>
      </p>
      <div className="mt-4 aspect-video w-full overflow-hidden rounded-lg bg-ink">
        <iframe
          className="h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${v.youtubeId}`}
          title={v.title}
          loading="lazy"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
      <p className="mt-4">
        <AiBadge /> <span className="text-muted">Curator note (AI-written):</span> {v.blurb}
      </p>
      <p className="mt-2 text-xs text-muted">
        Video by {v.channel} on YouTube. Title and channel as published on YouTube, checked {v.verifiedAt}.
      </p>
    </article>
  );
}
