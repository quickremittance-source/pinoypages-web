import Link from "next/link";
import type { Listing } from "@/lib/guide";

export function ListingCard({ l }: { l: Listing }) {
  const featured = l.tier === "featured";
  return (
    <li className={`rounded-xl p-4 ${featured ? "border-2 border-sunset bg-sand" : "bg-white"}`}>
      <h3 className="text-lg font-semibold text-sea">
        <Link href={`/listing/${l.id}`}>{l.name}</Link>{" "}
        {featured && <span className="text-sm text-coral-dk">★ Featured</span>}
      </h3>
      <p className="text-sm">
        {l.area} · {l.phone} · {l.languages}
      </p>
      {l.tier === "qrkit" && <span className="ml-1 text-xs font-bold text-turqdk">QR Kit</span>}
      {!featured && (
        <Link href={`/upgrade?listing=${l.id}`} className="mt-2 inline-block text-sm font-bold text-coral-dk underline">
          Is this your business? Claim or upgrade
        </Link>
      )}
    </li>
  );
}
