import Link from "next/link";
import { liveTools } from "@/lib/registry";
import { brand } from "@/lib/guide";

const nav = [
  { href: "/edition", label: "2027 Edition" },
  { href: "/magazine", label: "Magazine" },
  { href: "/directory", label: "Directory" },
  { href: "/calendar", label: "Calendar" },
  { href: liveTools[0]?.route ?? "/", label: "Free tools" },
  { href: "/tax-deadlines", label: "Deadlines" },
  { href: "/upgrade", label: "Upgrade listing" },
  { href: "/advertise", label: "Advertise" },
];

export function Header() {
  return (
    <header className="border-b border-sand bg-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-coral-dk focus:p-2 focus:text-white"
      >
        Skip to content
      </a>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        <Link href="/" className="font-display text-xl font-semibold text-sea">
          {brand.name} <span className="text-coral-dk">{brand.edition}</span>
          <span className="block text-xs font-normal text-ink">Money &amp; Business · {brand.tagline}</span>
        </Link>
        <nav aria-label="Main">
          <ul className="flex flex-wrap gap-1 text-sm font-bold text-sea">
            {nav.map((n) => (
              <li key={n.href}>
                <Link className="inline-block rounded px-2 py-2 hover:text-coral-dk" href={n.href}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-16 bg-sea text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-4 px-4 py-8 text-sm">
        <p>
          © {brand.edition} {brand.editionName} (annual edition). General information only — not tax, legal or financial
          advice.
        </p>
        <p className="flex gap-4">
          <Link href="/privacy" className="underline">
            Privacy
          </Link>
          <Link href="/advertise" className="underline">
            Advertise
          </Link>
          <Link href="/terms" className="underline">
            Terms
          </Link>
        </p>
      </div>
    </footer>
  );
}

export function PageHead({
  kicker,
  title,
  intro,
  page,
}: {
  kicker: string;
  title: string;
  intro?: string;
  page?: number;
}) {
  return (
    <div className="bg-aqua">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="kicker">
          {kicker}
          {page ? ` · Print page ${page}` : ""}
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-sea">{title}</h1>
        {intro && <p className="mt-3 max-w-2xl text-lg">{intro}</p>}
      </div>
    </div>
  );
}
