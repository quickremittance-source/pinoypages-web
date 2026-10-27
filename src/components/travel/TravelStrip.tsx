import Link from "next/link";
import { Postcard } from "@/components/travel/Postcard";
import { destination, toCard } from "@/lib/travel";

/** Light accent: three postcards linking to /travel. Used on the homepage and category pages. */
export function TravelStrip({
  slugs,
  placement,
  title = "Postcards from the GTA and beyond",
  plain = false,
}: {
  slugs: string[];
  placement: string;
  title?: string;
  /** Plain postcards (no photos), for pages that stay image-free such as the homepage. */
  plain?: boolean;
}) {
  const ds = slugs.map(destination).filter((d) => d !== undefined);
  if (!ds.length) return null;
  return (
    <section aria-labelledby={`strip-${placement}`} data-testid="travel-strip" className="rounded-2xl bg-aqua/50 p-6">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="kicker">Travel · Paglalakbay</p>
          <h2 id={`strip-${placement}`} className="mt-1 text-xl font-extrabold text-ink">
            {title}
          </h2>
        </div>
        <Link href="/travel" className="text-sm font-semibold text-sea">
          Day trips and travel guides →
        </Link>
      </div>
      <ul className="mt-6 grid gap-6 sm:grid-cols-3">
        {ds.map((d, i) => (
          <li key={d.slug}>
            <Postcard
              card={plain ? { ...toCard(d), photo: undefined } : toCard(d)}
              index={i}
              placement={placement}
              size="sm"
            />
          </li>
        ))}
      </ul>
      {!plain && (
        <p className="mt-4 text-[11px] text-muted">
          Photos from Wikimedia Commons; see{" "}
          <Link href="/travel#credits" className="underline">
            photo credits
          </Link>
          .
        </p>
      )}
    </section>
  );
}
