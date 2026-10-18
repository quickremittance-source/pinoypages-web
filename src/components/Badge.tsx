import { badgeState, brand, initials, logoColor, shortDate, type Listing, isVerified } from "@/lib/guide";

/** Badge check mark (inline SVG, no font glyph needed). */
function Check({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 16 16" className={className} focusable="false">
      <circle cx="8" cy="8" r="8" fill="#fff" />
      <path d="M4.5 8.3l2.2 2.2 4.8-4.9" fill="none" stroke="#C8102E" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** The one pilot badge. Rendered only for listings whose badge state is "active" (see isVerified). */
export function VerifiedKabayan({ l, withDate = false }: { l: Listing; withDate?: boolean }) {
  if (!isVerified(l)) return null;
  return (
    <span
      data-testid="vk-badge"
      className="inline-flex flex-wrap items-center gap-1 rounded-md bg-phred px-2 py-0.5 text-xs font-bold text-white"
    >
      <Check /> Verified Kabayan
      {withDate && l.verifiedOn && " "}
      {withDate && l.verifiedOn && <span className="font-medium">· Verified {shortDate(l.verifiedOn)}</span>}
    </span>
  );
}

/** Compact status for non-active Verified listings (paused / expired / pending). Never looks like the badge. */
export function BadgeStateChip({ l }: { l: Listing }) {
  const s = badgeState(l);
  if (s === "active" || s === "none") return null;
  const text =
    s === "paused"
      ? "Badge paused · under review"
      : s === "expired"
        ? "Badge expired · renewal due"
        : "Verification pending";
  return (
    <span
      data-state={s}
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold ${
        s === "paused" ? "border-phred/50 bg-white text-red-dk" : "border-ink/30 bg-sand text-ink"
      }`}
    >
      {text}
    </span>
  );
}

export function PartnerStars({ n, testId }: { n: number; testId?: string }) {
  if (n < 1) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs font-bold text-ink" data-testid={testId}>
      <span aria-hidden="true" className="inline-flex">
        {Array.from({ length: Math.min(n, 5) }, (_, i) => (
          <svg key={i} viewBox="0 0 20 20" className="h-3.5 w-3.5" focusable="false">
            <path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8z" fill="#F2B705" />
          </svg>
        ))}
      </span>
      {n} mutual partner{n > 1 ? "s" : ""}
    </span>
  );
}

/** Prototype logo tile: initials on a brand colour (real logos are uploaded at the visit). */
export function LogoTile({ l, size = "md" }: { l: Pick<Listing, "id" | "name">; size?: "sm" | "md" | "lg" }) {
  const cls =
    size === "lg"
      ? "h-20 w-20 text-2xl rounded-2xl"
      : size === "sm"
        ? "h-10 w-10 text-sm rounded-lg"
        : "h-14 w-14 text-lg rounded-xl";
  return (
    <span
      aria-hidden="true"
      className={`relative grid shrink-0 place-items-center overflow-hidden font-extrabold text-white ${cls}`}
      style={{ background: logoColor(l.id) }}
    >
      {initials(l.name)}
      <span className="absolute inset-x-0 bottom-0 h-1 bg-white/40" />
    </span>
  );
}

/** “Digital card by ZCard” mark, carried by every Verified listing. */
export function ZCardMark() {
  return (
    <span className="inline-block rounded-md border border-turqdk px-1.5 py-0.5 text-xs font-bold text-turqdk">
      {brand.zcardMark}
    </span>
  );
}

export function SampleChip() {
  return <span className="sample-chip">Sample</span>;
}
