import Link from "next/link";
import { LogoTile, PartnerStars, VerifiedKabayan } from "@/components/Badge";
import { CategoryTiles } from "@/components/CategoryTiles";
import { JsonLd } from "@/components/JsonLd";
import { ListingCard } from "@/components/ListingCard";
import { UpcomingEvents } from "@/components/UpcomingEvents";
import { brand, featuredListings, listingById, mutualPartners, sections, SITE_URL } from "@/lib/guide";
import { liveTools } from "@/lib/registry";

const STEPS = [
  {
    t: "Get visited",
    d: "A ~15-minute visit checks you're kabayan-owned or run, really trading, and your ZCard is complete.",
  },
  { t: "Get vouched", d: "One mutual vouch from a verified business. Founding members are vouched for at the visit." },
  { t: "Share your QR", d: "Put one QR on your cards, flyers and counter. Every scan opens your ZCard." },
  { t: "See the proof", d: "A monthly scan report shows how many people found you and saved your contact." },
];

const TOOLS = [
  ...liveTools.map((t) => ({
    href: t.route,
    t: t.title,
    d:
      (
        {
          cpp: "What will CPP cost you this year?",
          "peso-converter": "Convert Canadian dollars to pesos at today's reference rate.",
          "remittance-compare": "Compare fees and rates for sending money home.",
          "balikbayan-box": "Find balikbayan box carriers and ask for a quote.",
        } as Record<string, string>
      )[t.id] ?? "",
  })),
  { href: "/tax-deadlines", t: "2027 tax deadlines", d: "The CRA dates that matter for your 2026 return." },
  { href: "/calendar", t: "Money & Business Calendar", d: "Deadlines and community events, Spring to Fall." },
];

function ZCardPreview() {
  const l = listingById("tax-01");
  if (!l) return null;
  return (
    <div className="relative mx-auto w-full max-w-[300px]" aria-label="Sample ZCard preview" role="group">
      <div className="rounded-[2rem] border-8 border-ink bg-white p-4 shadow-2xl">
        <div className="mx-auto mb-3 h-1.5 w-16 rounded-full bg-sand" aria-hidden="true" />
        <p className="kicker">ZCard · Sample</p>
        <div className="mt-3 flex items-center gap-3">
          <LogoTile l={l} />
          <div>
            <p className="leading-tight font-extrabold text-ink">{l.zcard?.person}</p>
            <p className="text-xs text-muted">{l.name}</p>
          </div>
        </div>
        <div className="mt-3">
          <VerifiedKabayan l={l} withDate />
        </div>
        <div className="mt-2">
          <PartnerStars n={mutualPartners(l).length} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm" aria-hidden="true">
          <span className="rounded-lg bg-phred py-2 text-center font-semibold text-white">Call / Book</span>
          <span className="rounded-lg bg-turqdk py-2 text-center font-semibold text-white">Save contact</span>
        </div>
        <p className="mt-3 mb-6 text-[11px] text-muted">{brand.qrLine}</p>
      </div>
      <div
        className="absolute -bottom-6 -left-4 rounded-xl bg-white px-3 py-2 shadow-lg sm:-left-10"
        aria-hidden="true"
      >
        <p className="text-[10px] font-bold tracking-wider text-muted uppercase">Scans this month · sample</p>
        <p className="text-2xl font-extrabold text-turqdk">38</p>
      </div>
    </div>
  );
}

export const metadata = { title: "Classic home", alternates: { canonical: "/classic" } };

export default function Home() {
  const featured = featuredListings().slice(0, 6);
  const live = sections.find((s) => s.status === "live")!;
  const coming = sections.filter((s) => s.status === "coming");
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebSite", name: brand.name, url: SITE_URL }} />
      <section className="pinstripe-bg relative overflow-hidden border-b border-sand bg-aqua/50">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:grid-cols-[1.25fr_1fr] md:py-16">
          <div>
            <p className="kicker">
              {brand.tagline} · {brand.region}
            </p>
            <h1 className="mt-3 text-4xl leading-[1.08] font-extrabold text-ink sm:text-5xl">
              Be the kabayan they can trust <span className="text-phred">— and see proof people found you</span>
            </h1>
            <p className="mt-4 max-w-xl text-lg text-muted">
              Pinoy Pages lists Filipino-run tax, insurance, bookkeeping and business pros in the GTA. Verified
              businesses are visited in person, vouched for by another kabayan business, and get a QR that counts every
              scan.
            </p>
            <p
              className="mt-4 inline-block rounded-md border border-turqdk/40 bg-white px-2 py-1 text-sm font-bold text-sea"
              data-testid="category-tag"
            >
              {brand.categoryLabel}
            </p>
            <form
              action="/directory"
              method="get"
              role="search"
              aria-label="Find a business"
              className="mt-6 flex max-w-xl gap-2"
            >
              <label htmlFor="home-q" className="sr-only">
                Business name
              </label>
              <input
                id="home-q"
                name="q"
                type="search"
                placeholder="Search a business name"
                className="field mt-0 flex-1 py-2.5"
              />
              <button className="btn btn-teal">Search</button>
            </form>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link className="btn" href="/get-verified">
                Get Verified · $199
              </Link>
              <Link className="btn btn-ghost" href="/directory">
                Browse the directory
              </Link>
            </div>
          </div>
          <ZCardPreview />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="cats">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="kicker">Category: {live.name}</p>
            <h2 id="cats" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
              Browse by category
            </h2>
          </div>
          <Link href={`/directory/${live.slug}`} className="text-sm font-semibold text-turqdk underline">
            All of {live.name}
          </Link>
        </div>
        <div className="mt-5">
          <CategoryTiles section={live} />
        </div>
        {coming.map((s) => (
          <p key={s.slug} className="mt-3 rounded-xl border-2 border-dashed border-ink/15 px-4 py-3 text-sm text-muted">
            <strong className="text-ink">{s.name}</strong> · coming {s.edition}
          </p>
        ))}
      </section>

      <section className="border-y border-sand bg-sand/40" aria-labelledby="featured">
        <div className="mx-auto max-w-6xl px-4 py-12">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <div>
              <p className="kicker">Visited · vouched · current</p>
              <h2 id="featured" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
                Featured Verified businesses
              </h2>
            </div>
            <Link href="/directory" className="text-sm font-semibold text-turqdk underline">
              See the whole directory
            </Link>
          </div>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="featured-verified">
            {featured.map((l) => (
              <ListingCard key={l.id} l={l} />
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">Businesses marked SAMPLE are fictional, for the prototype.</p>
        </div>
      </section>

      <section aria-labelledby="list-band" className="mx-auto max-w-6xl px-4 pt-12" data-testid="list-band">
        <h2 id="list-band" className="sr-only">
          List your business
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card flex flex-col p-6">
            <p className="kicker">Free</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">List your business free</h3>
            <p className="mt-2 text-muted">
              Your name, phone and city in the directory. Unverified, and free for as long as you want it.
            </p>
            <Link href="/list-free" className="btn btn-ghost mt-auto self-start">
              List free
            </Link>
          </div>
          <div className="card flex flex-col border-2 border-phred p-6">
            <p className="kicker">Verified · {brand.pilotLabel}</p>
            <h3 className="mt-1 text-2xl font-extrabold text-ink">Get Verified · $199</h3>
            <p className="mt-2 text-muted">
              A featured card, the badge once you pass the visit and a mutual vouch, your ZCard and QR, and a monthly
              scan report. One price per issue, everything included.
            </p>
            <Link href="/get-verified" className="btn mt-4 self-start">
              Get Verified
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-12">
        <UpcomingEvents />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12" aria-labelledby="how">
        <div className="card overflow-hidden">
          <div className="pinstripe" aria-hidden="true" />
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_2fr]">
            <div>
              <p className="kicker">Get Verified · {brand.pilotLabel}</p>
              <h2 id="how" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
                Earned, never bought
              </h2>
              <p className="mt-2 text-muted">
                $199 per issue, everything included. Payment makes you eligible; the badge is earned.
              </p>
              <Link href="/get-verified" className="btn mt-5">
                Get Verified
              </Link>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s, i) => (
                <li key={s.t} className="flex gap-3">
                  <span
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-phred text-sm font-extrabold text-white"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <span>
                    <strong className="block text-ink">{s.t}</strong>
                    <span className="text-sm text-muted">{s.d}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-4" aria-labelledby="tools">
        <p className="kicker">Free for everyone</p>
        <h2 id="tools" className="mt-1 text-2xl font-bold text-ink sm:text-3xl">
          Free money tools
        </h2>
        <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TOOLS.map((t) => (
            <li key={t.href}>
              <Link href={t.href} className="card group block h-full border-l-4 border-l-turq p-4 hover:shadow-md">
                <strong className="block text-ink group-hover:text-sea">{t.t}</strong>
                <span className="text-sm text-muted">{t.d}</span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-sm text-muted">
          Also coming:{" "}
          <Link href="/awards" className="font-semibold text-turqdk underline">
            Pinoy Pages Awards, April 2027
          </Link>
          .
        </p>
      </section>
    </>
  );
}
