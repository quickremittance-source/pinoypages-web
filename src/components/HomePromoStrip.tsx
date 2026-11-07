import Link from "next/link";

/** Slim Community + Magazine strip for the home (Directory) page. */
export function HomePromoStrip() {
  return (
    <aside
      data-testid="home-promo-strip"
      aria-label="Community and Magazine"
      className="border-b border-sand bg-aqua/70"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-1.5 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-center sm:gap-6">
        <Link href="/advertise" className="font-semibold text-navy hover:underline">
          Community
        </Link>
        <span className="hidden text-turqdk sm:inline" aria-hidden="true">
          ·
        </span>
        <Link href="/magazine" className="font-semibold text-navy hover:underline">
          Read the Magazine
        </Link>
      </div>
    </aside>
  );
}
