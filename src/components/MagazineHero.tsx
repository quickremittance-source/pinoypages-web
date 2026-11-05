import Image from "next/image";
import { colors } from "@/brand";

export const MAGAZINE_COLLAGE = "/brand/magazine/collage.webp";

/** Hero banner for Magazine, Events, Tools, Directory and Advertise pages: shared public-domain postcard collage under a navy→teal overlay. */
export function MagazineHero({
  kicker,
  title,
  intro,
  page,
  children,
}: {
  kicker?: string;
  title: string;
  intro?: string;
  page?: number;
  children?: React.ReactNode;
}) {
  return (
    <section className="magazine-hero relative isolate overflow-hidden shadow-md" data-magazine-hero>
      <Image
        src={MAGAZINE_COLLAGE}
        alt=""
        aria-hidden="true"
        fill
        priority
        sizes="100vw"
        className="-z-20 object-cover"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background: `linear-gradient(100deg, ${colors.navy.hex}F2 0%, ${colors.navy.hex}D9 45%, ${colors.teal.hex}99 100%)`,
        }}
      />
      <div className="mx-auto flex min-h-[220px] max-w-6xl flex-col justify-center px-4 py-10 text-white sm:min-h-[320px]">
        {(kicker || page) && (
          <p className="text-xs font-bold tracking-[0.2em] text-white/85 uppercase">
            {kicker}
            {page ? ` · Print page ${page}` : ""}
          </p>
        )}
        <span aria-hidden="true" className="mt-3 block h-1 w-12" style={{ background: colors.red.hex }} />
        <h1 className="mt-3 text-4xl leading-tight font-extrabold tracking-tight text-white sm:text-5xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg text-white/90">{intro}</p>}
        {children && <div className="magazine-hero-extra mt-4">{children}</div>}
        <p className="mt-6 text-[11px] text-white/70">
          Collage of public-domain vintage postcards (Manila &amp; Toronto, c. 1910).
        </p>
      </div>
    </section>
  );
}
