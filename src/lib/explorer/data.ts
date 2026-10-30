import type { ExplorerTopic, ExplorerVideo } from "./types";
import { VIDEOS } from "./videos";

/** Base path. Change here (and in next.config redirects) when the section spins off to balikbayanexplorer.com. */
export const BE = "/explore";

export const TOPICS: { slug: ExplorerTopic; label: string; intro: string }[] = [
  {
    slug: "travel",
    label: "Travel",
    intro: "Trips home and around the Philippines: flights from Toronto, arrival at NAIA, eTravel and destinations.",
  },
  {
    slug: "remittance",
    label: "Remittance",
    intro: "Sending money from Canada to the Philippines: banks, e-wallets such as GCash, and what to compare.",
  },
  {
    slug: "padala",
    label: "Padala & balikbayan boxes",
    intro: "Packing and shipping balikbayan boxes from the GTA, and the Bureau of Customs rules.",
  },
];

export const isTopic = (s: string): s is ExplorerTopic => TOPICS.some((t) => t.slug === s);

export function getVideos(topic?: ExplorerTopic): ExplorerVideo[] {
  return VIDEOS.filter((v) => !topic || v.topic === topic);
}

export const getVideo = (id: string) => VIDEOS.find((v) => v.youtubeId === id);

export const thumb = (id: string) => `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
