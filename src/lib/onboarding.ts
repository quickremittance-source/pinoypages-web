/** Pure onboarding helpers (no DB, safe in tests). */
export const DECISIONS = ["approve", "reject", "spam"] as const;
export type Decision = (typeof DECISIONS)[number];
export const STATUS_FOR: Record<Decision, string> = { approve: "won", reject: "lost", spam: "spam" };
export const PRICE_NOTE = "$199 for the Foundation Edition (no HST). Verified is earned by passing the live video check; it cannot be bought.";
export const AD_TIERS = ["full", "half", "quarter", "zcard"] as const;

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

/** QR targets are locked to pinoypages.ca /go/<id> or /card/<id>. */
export const QR_TARGET = /^https:\/\/(www\.)?pinoypages\.ca\/(go|card)\/[A-Za-z0-9_-]{1,80}$/;
export const qrTargetFor = (listingId: string, kind: "go" | "card" = "go") => {
  const u = `https://pinoypages.ca/${kind}/${listingId}`;
  if (!QR_TARGET.test(u)) throw new Error("invalid QR target");
  return u;
};
export const qrCodeFor = (label: string, listingId: string) => `${slugify(label) || "qr"}-${listingId}`.slice(0, 80);

/** Verified lasts one quarterly issue: until the last day of the calendar quarter after the current one. */
export function verifiedUntil(today: string): string {
  const [y = 1970, m = 1] = today.split("-").map(Number);
  const q = Math.floor((m - 1) / 3); // 0..3 current quarter
  const endMonth = (q + 2) * 3; // last month of next quarter, may exceed 12
  const yy = y + Math.floor((endMonth - 1) / 12);
  const mm = ((endMonth - 1) % 12) + 1;
  const last = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  return `${yy}-${String(mm).padStart(2, "0")}-${String(last).padStart(2, "0")}`;
}

type Inq = { id: number; kind: string; name: string | null; business: string | null; phone: string | null; listing_id: string | null; product: string | null; payload: Record<string, unknown> };

/** What approving an inquiry creates. Public business details only; never the email or contact name. */
export function planFor(i: Inq):
  | { type: "listing"; mode: "insert" | "update"; listing_id: string; name: string; category: string | null; area: string | null; phone: string | null; tier: "free" | "verified" }
  | { type: "ad"; slug: string; tier: (typeof AD_TIERS)[number]; name: string; phone: string | null }
  | { type: "none"; reason: string } {
  const p = i.payload ?? {};
  const name = (i.business || "").trim();
  if (i.kind === "free-listing") {
    if (!name) return { type: "none", reason: "no business name" };
    return { type: "listing", mode: "insert", listing_id: slugify(name), name, category: (p.sub as string) ?? null, area: (p.city as string) ?? null, phone: i.phone, tier: "free" };
  }
  if (i.kind === "listing-claim") {
    const id = i.listing_id || slugify(name);
    if (!id) return { type: "none", reason: "no listing" };
    return { type: "listing", mode: i.listing_id ? "update" : "insert", listing_id: id, name: name || id, category: null, area: null, phone: i.phone, tier: i.product === "free" ? "free" : "verified" };
  }
  if (i.kind === "ad-inquiry" && i.product === "landing-photo") {
    return { type: "none", reason: "standard photo landing page: price pending, set up by hand" };
  }
  if (i.kind === "ad-inquiry") {
    const tier = (AD_TIERS as readonly string[]).includes(i.product ?? "") ? (i.product as (typeof AD_TIERS)[number]) : "zcard";
    if (!name) return { type: "none", reason: "no business name" };
    return { type: "ad", slug: slugify(name), tier, name, phone: i.phone };
  }
  return { type: "none", reason: `${i.kind} has nothing to create` };
}

/** Draft welcome email for Jose to send himself. Nothing is sent by the site. */
export function welcomeDraft(o: { business: string; cardUrl: string; statsUrl?: string | null; verified: boolean }) {
  return [
    `Subject: Welcome to PinoyPages, ${o.business}`,
    "",
    `Hi ${o.business} team,`,
    "",
    "Your PinoyPages listing is set up. Here is your welcome pack:",
    `- Your listing: ${o.cardUrl}`,
    ...(o.statsUrl ? [`- Your private results page (please keep it private): ${o.statsUrl}`] : []),
    "",
    o.verified
      ? "Your Verified badge is active after passing our live video check."
      : "Verified is earned by passing a short live video check; it cannot be bought.",
    "Kabayan Verified is $199 for the Foundation Edition and is an identity badge only. A standard ad landing page with a photo is the only optional upgrade at launch; price on enquiry.",
    "",
    "Salamat,",
    "Jose, PinoyPages",
  ].join("\n");
}
