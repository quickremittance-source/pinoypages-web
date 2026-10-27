"use client";
import Link from "next/link";
import { track } from "@/lib/gtag";

export type PostcardData = {
  slug: string;
  hub: string;
  name: string;
  region: string;
  caption: string;
  href: string;
  photo?: { src: string; width: number; height: number; alt: string };
};

const TILTS = [
  "-rotate-[1.5deg]",
  "rotate-[1deg]",
  "-rotate-[0.5deg]",
  "rotate-[1.75deg]",
  "-rotate-[1deg]",
  "rotate-[0.5deg]",
];

/** Postmark: Pinoy Pages mark inside a stamp with a wavy cancellation line. Decorative only. */
function Stamp({ region }: { region: string }) {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute top-3 right-3 flex items-center">
      <span className="relative z-10 grid h-14 w-12 place-items-center border-2 border-dashed border-phred/70 bg-white p-1 shadow-sm">
        <span
          className="block h-9 w-9 bg-contain bg-center bg-no-repeat"
          style={{ backgroundImage: "url(/brand/pinoypages-mark.png)" }}
        />
      </span>
      <span className="absolute -left-16 top-1 grid h-14 w-14 -rotate-12 place-items-center rounded-full border-2 border-ink/50 text-center text-[7px] leading-tight font-bold tracking-wider text-ink/85 uppercase">
        {region.slice(0, 18)}
        <br />
        Pinoy Pages
      </span>
    </span>
  );
}

/**
 * A postcard: white border, slight tilt, caption and a postmarked stamp.
 * Without a licensed photo it renders as a plain postcard (no image), never a stand-in.
 */
export function Postcard({
  card,
  index = 0,
  placement,
  size = "md",
  eager = false,
}: {
  card: PostcardData;
  index?: number;
  placement: string;
  size?: "sm" | "md";
  /** Above-the-fold hero: load eagerly. Everything else lazy-loads. */
  eager?: boolean;
}) {
  const tilt = TILTS[index % TILTS.length];
  return (
    <Link
      href={card.href}
      data-postcard={card.slug}
      data-has-photo={card.photo ? "true" : "false"}
      onClick={() =>
        track("postcard_click", {
          destination: card.slug,
          hub: card.hub,
          placement,
          position: index + 1,
        })
      }
      className={`group block ${tilt} transition-transform duration-200 hover:rotate-0 hover:-translate-y-1 focus-visible:rotate-0 motion-reduce:transform-none`}
    >
      <figure className="relative bg-white p-2.5 pb-3 shadow-[0_6px_18px_rgba(16,24,40,0.18)] ring-1 ring-ink/5">
        {card.photo ? (
          // eslint-disable-next-line @next/next/no-img-element -- pre-sized WebP, native lazy loading
          <img
            src={card.photo.src}
            alt={card.photo.alt}
            width={card.photo.width}
            height={card.photo.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className={`w-full object-cover ${size === "sm" ? "aspect-[4/3]" : "aspect-[3/2]"}`}
          />
        ) : (
          <div
            className={`flex w-full flex-col justify-end border border-sand bg-[#fbf8f1] p-4 ${size === "sm" ? "aspect-[4/3]" : "aspect-[3/2]"}`}
            data-testid="plain-postcard"
          >
            <span className="font-serif text-2xl font-bold text-sea italic">Greetings from</span>
            <span className="text-3xl font-extrabold text-phred">{card.name}</span>
            <span className="mt-3 block h-px w-2/3 bg-ink/15" />
            <span className="mt-2 block h-px w-1/2 bg-ink/15" />
          </div>
        )}
        <Stamp region={card.region} />
        <figcaption className="mt-2 px-1">
          <span className="block font-bold text-ink group-hover:text-phred">{card.name}</span>
          <span className="block font-serif text-sm text-muted italic">{card.caption}</span>
        </figcaption>
      </figure>
    </Link>
  );
}
