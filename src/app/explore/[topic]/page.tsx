import { notFound } from "next/navigation";
import { VideoCard } from "@/components/explorer/ui";
import { TOPICS, getVideos, isTopic } from "@/lib/explorer/data";
import { beMeta } from "../meta";

export const dynamicParams = false;
export const generateStaticParams = () => TOPICS.map((t) => ({ topic: t.slug }));

export async function generateMetadata({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  const t = TOPICS.find((x) => x.slug === topic);
  return t ? beMeta(`${t.label} Videos`, t.intro, `/${t.slug}`) : {};
}

export default async function TopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!isTopic(topic)) notFound();
  const t = TOPICS.find((x) => x.slug === topic)!;
  const vs = getVideos(topic);
  return (
    <>
      <h1 className="mt-6 text-2xl font-bold text-sea">{t.label}</h1>
      <p className="mb-4 text-muted">{t.intro}</p>
      <ul className="grid gap-4 sm:grid-cols-3">
        {vs.map((v) => (
          <VideoCard key={v.youtubeId} v={v} />
        ))}
      </ul>
    </>
  );
}
