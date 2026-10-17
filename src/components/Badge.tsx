import { brand, longDate, type Listing, isVerified } from "@/lib/guide";

/** The one pilot badge. Rendered only for listings that passed the verification visit (see isVerified). */
export function VerifiedKabayan({ l, withDate = false }: { l: Listing; withDate?: boolean }) {
  if (!isVerified(l)) return null;
  return (
    <span
      data-testid="vk-badge"
      className="ml-1 inline-flex items-center gap-1 rounded bg-phred px-1.5 py-0.5 text-xs font-bold text-white"
    >
      <span aria-hidden="true">✓</span> Verified Kabayan
      {withDate && l.verifiedOn && <span className="font-normal">· Verified {longDate(l.verifiedOn)}</span>}
    </span>
  );
}

/** “Digital card by ZCard” mark, carried by every paid listing. */
export function ZCardMark() {
  return (
    <span className="inline-block rounded border border-turqdk px-1.5 py-0.5 text-xs font-bold text-turqdk">
      {brand.zcardMark}
    </span>
  );
}
