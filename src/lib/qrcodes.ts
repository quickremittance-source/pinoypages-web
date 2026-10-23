import { publicListings } from "@/lib/public";
import { bizPath, slugOf } from "@/lib/seo";

/** Print placements for QR codes. Short code prefix keeps the printed URL compact: /q/ws-<business-slug>. */
export const QR_PLACEMENTS = {
  ws: "window-sticker",
  cc: "counter-card",
  fl: "flyer",
  eb: "event-booth",
} as const;
export type QrAbbr = keyof typeof QR_PLACEMENTS;

export const qrCode = (businessSlug: string, abbr: QrAbbr) => `${abbr}-${businessSlug}`;

export function resolveQr(code: string) {
  const m = /^(ws|cc|fl|eb)-(.+)$/.exec(code);
  if (!m) return null;
  const l = publicListings.find((x) => slugOf(x) === m[2]);
  if (!l) return null;
  const medium = QR_PLACEMENTS[m[1] as QrAbbr];
  const target = `${bizPath(l)}?utm_source=qr&utm_medium=${medium}&utm_campaign=founding`;
  return { listing: l, medium, target };
}
