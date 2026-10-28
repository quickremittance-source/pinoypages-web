import { ZCARD_SUBMARK, BADGE_VERIFIED_PP } from "./svgs";

/** "powered by zcard" lock-up for QR Code Landing Pages (full and half tiers). */
export function PoweredByZcard() {
  return (
    <div data-testid="powered-by-zcard" className="rounded-xl bg-[#032357] px-4 py-3 text-center text-[#F7F4EC]">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FCC645]">powered by zcard</p>
      <div
        className="mx-auto mt-1 max-w-[260px] [&_svg]:h-auto [&_svg]:w-full"
        dangerouslySetInnerHTML={{ __html: ZCARD_SUBMARK }}
      />
      <p className="mt-1 text-xs">QR Code Landing Page by PinoyPages (formerly zcard)</p>
    </div>
  );
}

export function VerifiedPlusPlusBadge() {
  return (
    <span
      data-testid="badge-verified-pp"
      className="block max-w-[260px] [&_svg]:h-auto [&_svg]:w-full"
      dangerouslySetInnerHTML={{ __html: BADGE_VERIFIED_PP }}
    />
  );
}
