import Link from "next/link";
import { BadgeStateChip, LogoTile, PartnerStars, SampleChip, VerifiedKabayan } from "@/components/Badge";
import { badgeState, categoryBySlug, isVerified, mutualPartners, type Listing } from "@/lib/guide";

/** data-* attributes read by the client-side directory search (name, sub-category, city, language). */
const searchData = (l: Listing) => ({
  "data-listing": l.id,
  "data-name": l.name.toLowerCase(),
  "data-sub": l.category,
  "data-city": l.area,
  "data-langs": l.languages,
});

export function ListingCard({ l, compact = false }: { l: Listing; compact?: boolean }) {
  if (compact) {
    // Sidebar mention (articles): logo, name, badge or state, area. Links to the listing.
    return (
      <li className="card flex items-center gap-3 p-3" data-listing-mention={l.id} data-badge={badgeState(l)}>
        <LogoTile l={l} size="sm" />
        <div className="min-w-0">
          <Link href={`/listing/${l.id}`} className="font-bold text-ink hover:underline">
            {l.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-xs text-muted">
            <VerifiedKabayan l={l} />
            <BadgeStateChip l={l} />
            <span>{l.area}</span>
            {l.sample && <SampleChip />}
          </div>
        </div>
      </li>
    );
  }
  if (l.tier === "free") {
    // Free = unverified: one text line, name + contact only. No badge, logo, QR, Save contact or ZCard.
    return (
      <li
        className="flex flex-wrap items-baseline gap-x-2 gap-y-1 border-b border-sand py-2.5 text-sm"
        data-tier="free"
        {...searchData(l)}
      >
        <Link href={`/listing/${l.id}`} className="font-semibold text-ink hover:underline">
          {l.name}
        </Link>
        <span className="text-muted">
          · {l.phone} · {l.area}
        </span>
        {l.sample && <SampleChip />}
        <span className="ml-auto text-xs text-muted" data-testid="free-claim">
          Is this your business?{" "}
          <Link href={`/upgrade?listing=${l.id}`} className="font-semibold text-turqdk underline">
            Claim it free
          </Link>{" "}
          ·{" "}
          <Link href={`/get-verified?listing=${l.id}`} className="font-semibold text-turqdk underline">
            Get Verified
          </Link>
        </span>
      </li>
    );
  }
  const state = badgeState(l);
  const partners = mutualPartners(l).length;
  const sub = categoryBySlug(l.category)?.name;
  return (
    <li
      className={`card flex flex-col p-4 ${state === "active" ? "border-t-4 border-t-phred" : "border-t-4 border-t-sand"}`}
      data-tier={l.tier}
      data-verified={isVerified(l) ? "yes" : "no"}
      data-badge={state}
      {...searchData(l)}
    >
      <div className="flex items-start gap-3">
        <LogoTile l={l} />
        <div className="min-w-0 flex-1">
          <h3 className="text-lg leading-snug font-bold text-ink">
            <Link href={`/listing/${l.id}`} className="hover:underline">
              {l.name}
            </Link>
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            {sub} {l.sample && <SampleChip />}
          </p>
        </div>
        <Link href={`/card/${l.id}`} className="hidden shrink-0 sm:block" aria-label={`Open the ZCard for ${l.name}`}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static SVG from our own route */}
          <img src={`/qr/${l.id}/qr.svg`} alt={`QR code for ${l.name}`} width={58} height={72} className="rounded" />
        </Link>
      </div>
      {l.tagline && <p className="mt-3 font-semibold">{l.tagline}</p>}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <VerifiedKabayan l={l} withDate />
        <BadgeStateChip l={l} />
        {state === "active" && <PartnerStars n={partners} />}
      </div>
      <p className="mt-2 text-sm text-muted">
        {l.area} · {l.languages}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <a href={`/go/${l.id}?via=call`} className="btn px-3.5 py-2 text-sm">
          Call / Book
        </a>
        <a href={`/vcard/${l.id}.vcf`} download className="btn btn-ghost px-3.5 py-2 text-sm">
          Save contact
        </a>
        <Link href={`/card/${l.id}`} className="btn btn-ghost px-3.5 py-2 text-sm">
          ZCard
        </Link>
      </div>
    </li>
  );
}
