import Link from "next/link";
import { BE, thumb } from "@/lib/explorer/data";
import type { ExplorerVideo } from "@/lib/explorer/types";

export function DraftBadge() {
  return (
    <span
      data-testid="draft-badge"
      className="ml-1 inline-block rounded bg-sunset px-1.5 py-0.5 text-[11px] font-bold text-ink"
    >
      Draft – under review
    </span>
  );
}

export function AiBadge() {
  return (
    <span
      title="AI-written curator note"
      className="inline-block rounded bg-sea px-1.5 py-0.5 text-[11px] font-bold text-white"
    >
      AI
    </span>
  );
}

export function VideoCard({ v }: { v: ExplorerVideo }) {
  return (
    <li className="card overflow-hidden" data-topic={v.topic}>
      <Link href={`${BE}/videos/${v.youtubeId}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={thumb(v.youtubeId)} alt="" loading="lazy" className="aspect-video w-full object-cover" />
        <p className="p-3 font-semibold text-sea">{v.title}</p>
      </Link>
      <p className="px-3 text-xs text-muted">
        {v.channel}
        {v.status === "draft" ? <DraftBadge /> : null}
      </p>
      <p className="px-3 pt-2 pb-3 text-sm">
        <AiBadge /> <span className="text-muted">Curator note (AI-written):</span> {v.blurb}
      </p>
    </li>
  );
}
