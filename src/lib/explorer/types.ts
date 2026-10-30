export type ExplorerTopic = "travel" | "remittance" | "padala";

export type ExplorerVideo = {
  youtubeId: string;
  topic: ExplorerTopic;
  /** Verbatim from YouTube oEmbed. */
  title: string;
  /** Verbatim from YouTube oEmbed. */
  channel: string;
  channelUrl: string;
  /** Curator blurb (AI-written, shown with an AI label). */
  blurb: string;
  status: "draft" | "published";
  /** Date the ID was checked against YouTube oEmbed (ET). */
  verifiedAt: string;
};
