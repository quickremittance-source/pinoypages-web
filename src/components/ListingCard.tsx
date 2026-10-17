import Link from "next/link";
import type { Listing } from "@/lib/guide";

export function Verified() {
  return <span className="ml-1 rounded bg-palm px-1.5 py-0.5 text-xs font-bold text-white">✓ Verified</span>;
}

export function ListingCard({ l }: { l: Listing }) {
  if (l.tier === "free") {
    // Free = name + contact details only, one line.
    return (
      <li className="rounded-xl bg-white p-3" data-tier="free">
        <Link href={`/listing/${l.id}`} className="font-bold text-sea">
          {l.name}
        </Link>{" "}
        · {l.phone} · {l.area}{" "}
        <Link href={`/upgrade?listing=${l.id}`} className="block text-sm font-bold text-coral-dk underline">
          Is this your business? Claim or upgrade
        </Link>
      </li>
    );
  }
  const featured = l.tier === "featured";
  return (
    <li
      className={`rounded-xl p-4 ${featured ? "border-2 border-sunset bg-sand" : "border border-palm bg-white"}`}
      data-tier={l.tier}
    >
      <div className="flex items-start gap-3">
        {featured && (
          <span
            aria-hidden="true"
            className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-sea font-display text-lg text-white"
          >
            {l.name
              .split(" ")
              .slice(0, 2)
              .map((w) => w[0])
              .join("")}
          </span>
        )}
        <div>
          <h3 className="text-lg font-semibold text-sea">
            <Link href={`/listing/${l.id}`}>{l.name}</Link> <Verified />
            {featured && <span className="ml-1 text-sm text-coral-dk">★ Featured</span>}
          </h3>
          {featured && l.tagline && <p className="font-bold">{l.tagline}</p>}
          <p className="text-sm">
            {l.area} · {l.phone} · {l.languages}
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
