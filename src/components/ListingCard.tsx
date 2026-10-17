import Link from "next/link";
import { VerifiedKabayan, ZCardMark } from "@/components/Badge";
import { isFeatured, isVerified, tierName, type Listing } from "@/lib/guide";

export function ListingCard({ l }: { l: Listing }) {
  if (l.tier === "free") {
    // Free = unverified: name + contact details only, one text line. No badge, QR, Save contact or ZCard.
    return (
      <li className="rounded-xl bg-white p-3" data-tier="free">
        <Link href={`/listing/${l.id}`} className="font-bold text-sea">
          {l.name}
        </Link>{" "}
        · {l.phone} · {l.area}{" "}
        <Link href={`/upgrade?listing=${l.id}`} className="block text-sm font-bold text-coral-dk underline">
          Is this your business? Claim or get Verified
        </Link>
      </li>
    );
  }
  const featured = isFeatured(l);
  return (
    <li
      className={`rounded-xl p-4 ${featured ? "border-2 border-phred bg-white" : "border border-turqdk bg-white"}`}
      data-tier={l.tier}
      data-verified={isVerified(l) ? "yes" : "no"}
    >
      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg font-display text-lg text-white ${featured ? "bg-phred" : "bg-sea"}`}
        >
          {l.name
            .split(" ")
            .slice(0, 2)
            .map((w) => w[0])
            .join("")}
        </span>
        <div>
          <h3 className={`text-lg text-sea ${featured ? "font-bold" : "font-semibold"}`}>
            <Link href={`/listing/${l.id}`}>{l.name}</Link> <VerifiedKabayan l={l} />
            {featured && <span className="ml-1 text-sm text-coral-dk">★ Featured</span>}
          </h3>
          {featured && l.tagline && <p className="font-bold">{l.tagline}</p>}
          <p className="text-sm">
            {l.area} · {l.phone} · {l.languages}
          </p>
          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold text-ink">{tierName(l.tier)}</span>
            <ZCardMark />
          </p>
          {featured && (
            <a href={`/go/${l.id}?via=call`} className="btn mt-2 text-sm">
              Call / Book
            </a>
          )}
        </div>
      </div>
    </li>
  );
}
