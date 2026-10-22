import Link from "next/link";
import { brand } from "@/lib/guide";

export function PublicNote() {
  return (
    <p className="rounded-lg border border-ink/10 bg-white px-3 py-2 text-xs text-muted" data-testid="public-note">
      Free listings are compiled from public information and are not verified. Owners can{" "}
      <Link href="/upgrade" className="font-semibold text-turqdk underline">
        claim
      </Link>
      , correct or remove a listing by{" "}
      <a href={`mailto:${brand.email}?subject=Listing%20correction`} className="font-semibold text-turqdk underline">
        emailing us
      </a>
      .
    </p>
  );
}
