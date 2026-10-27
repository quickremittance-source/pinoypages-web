import Image from "next/image";
import Link from "next/link";
import { liveTools } from "@/lib/registry";
import { brand } from "@/lib/guide";

const nav = [
  { href: "/advertise", label: "Advertise" },
  { href: "/directory", label: "Directory" },
  { href: "/food", label: "Food" },
  { href: "/get-verified", label: "Get Verified" },
  { href: "/awards", label: "Awards" },
  { href: liveTools[0]?.route ?? "/", label: "Free tools" },
  { href: "/tax-deadlines", label: "Deadlines" },
  { href: "/calendar", label: "Calendar" },
  { href: "/magazine", label: "Magazine" },
];

/** Brand mark: the official Pinoy Pages logo (pin + book + wordmark), horizontal layout. */
export function Logo({ small = false }: { small?: boolean }) {
  return (
    <Image
      src="/brand/pinoypages-logo-horizontal.png"
      alt="Pinoy Pages"
      width={1190}
      height={300}
      priority={!small}
      className={small ? "h-7 w-auto" : "h-9 w-auto sm:h-10"}
    />
  );
}

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-sand bg-white/95 backdrop-blur">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-phred focus:p-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="pinstripe" aria-hidden="true" />
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
        <div className="flex shrink-0 items-center">
          <Link href="/" aria-label={`${brand.name} home`} className="shrink-0">
            <Logo />
            <span className="sr-only">
              {brand.tagline} · {brand.region} · {brand.categoryLabel}
            </span>
          </Link>
          <span
            data-testid="alpha-badge"
            className="ml-2 inline-block rounded bg-turqdk px-1.5 py-0.5 align-middle text-[10px] font-bold tracking-wider text-white uppercase"
          >
            Alpha
          </span>
        </div>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm font-semibold text-ink">
            {nav.map((n) => (
              <li key={n.href}>
                <Link className="inline-block rounded-md px-2.5 py-2 hover:bg-aqua hover:text-sea" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Link href="/advertise" className="btn shrink-0 px-3.5 py-2 text-sm">
          Book an ad
        </Link>
      </div>
      <nav aria-label="Main (mobile)" className="border-t border-sand md:hidden">
        <ul className="flex gap-1 overflow-x-auto px-2 py-1 text-sm font-semibold whitespace-nowrap text-ink">
          {nav.map((n) => (
            <li key={n.href}>
              <Link className="inline-block rounded-md px-2.5 py-2" href={n.href}>
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 border-t border-sand bg-white">
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 text-sm sm:grid-cols-3">
        <div>
          <Logo small />
          <p className="mt-2 text-muted">
            {brand.tagline} · {brand.region}
          </p>
          <p className="mt-1 text-muted">{brand.categoryLabel}</p>
        </div>
        <ul className="space-y-1.5">
          <li>
            <Link href="/directory" className="hover:underline">
              Directory
            </Link>
          </li>
          <li>
            <Link href="/food" className="hover:underline">
              Food Finder
            </Link>
          </li>
          <li>
            <Link href="/list-free" className="hover:underline">
              List your business free
            </Link>
          </li>
          <li>
            <Link href="/get-verified" className="hover:underline">
              Get Verified
            </Link>
          </li>
          <li>
            <Link href="/awards" className="hover:underline">
              Awards (April 2027)
            </Link>
          </li>
          <li>
            <Link href="/edition" className="hover:underline">
              Pilot Edition
            </Link>
          </li>
        </ul>
        <div className="space-y-1.5">
          <p>
            Contact:{" "}
            <a className="font-semibold text-turqdk underline" href={`mailto:${brand.email}`}>
              {brand.email}
            </a>
          </p>
          <p className="flex flex-wrap gap-4">
            <Link href="/privacy" className="underline">
              Privacy
            </Link>
            <Link href="/terms" className="underline">
              Terms
            </Link>
            <Link href="/advertise" className="underline">
              Advertise
            </Link>
          </p>
          <p className="text-xs text-muted">
            pinoypages.ca · General information only — not tax, legal or financial advice. Businesses marked SAMPLE are
            fictional.
          </p>
        </div>
      </div>
      <div className="pinstripe" aria-hidden="true" />
      <div className="bg-phred py-2 text-center text-xs font-bold tracking-[0.2em] text-white uppercase">
        {brand.name} · {brand.pilotLabel}
      </div>
      <p data-testid="alpha-footer" className="py-2 text-center text-xs text-muted">
        Pinoy Pages Alpha — release 2026.11-alpha
      </p>
    </footer>
  );
}

export function PageHead({
  kicker,
  title,
  intro,
  page,
  children,
}: {
  kicker: string;
  title: string;
  intro?: string;
  page?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="pinstripe-bg border-b border-sand bg-aqua/60">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
        <p className="kicker">
          {kicker}
          {page ? ` · Print page ${page}` : ""}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold text-ink sm:text-4xl">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg text-muted">{intro}</p>}
        {children}
      </div>
    </div>
  );
}
