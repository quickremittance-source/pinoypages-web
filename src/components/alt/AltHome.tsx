import Link from "next/link";
import { SignupForm } from "@/components/Forms";
import { brand, sections } from "@/lib/guide";
import { areaCounts, categoryCounts, communityEvents, featuredForAlt, GTA_AREAS, POPULAR } from "./data";
import { FeaturedGrid } from "./FeaturedGrid";
import { PublicNote } from "./PublicNote";

const WHY = [
  {
    icon: "🔎",
    t: "For customers",
    d: "Find Filipino-run tax, insurance and business pros near you. A Verified Kabayan badge means the business was visited in person and vouched for by another verified business. Free listings are unverified.",
  },
  {
    icon: "🏪",
    t: "For businesses",
    d: "List free with your name and contact, or get Verified for $199 per issue: a featured card, a ZCard with Save contact, a QR that counts every scan, and a monthly scan report.",
  },
  {
    icon: "🤝",
    t: "For the community",
    d: "Events, deadlines and stories from the GTA's Filipino businesses, plus the Pinoy Pages Awards from April 2027, including Kabayan's Pick, chosen by members.",
  },
];

export function AltHome() {
  const cats = categoryCounts();
  const areas = areaCounts();
  const max = Math.max(...areas.map((a) => a.n));
  const total = areas.reduce((s, a) => s + a.n, 0);
  const coming = sections.filter((s) => s.status === "coming");
  const evs = communityEvents(4);
  return (
    <div data-testid="alt-home">
      <section className="relative overflow-hidden bg-gradient-to-br from-[#1b2328] via-turqdk to-phred text-white">
        <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
          <p
            className="inline-block rounded border border-white/60 px-2 py-0.5 text-[11px] font-bold tracking-[0.2em] uppercase"
            data-testid="confidential-badge"
          >
            Confidential draft
          </p>
          <p className="mt-4 text-sm font-semibold tracking-wide text-white/85" data-testid="brand-line">
            {brand.editionName} · {brand.tagline} · GTA
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl leading-[1.08] font-extrabold sm:text-6xl">
            Find a Filipino-run business you can trust
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/90">
            Tax, insurance, bookkeeping and independent pros across the Greater Toronto Area. Look for the Verified
            Kabayan badge: earned by an in-person visit and a vouch from another verified business.
          </p>
          <form
            action="/directory"
            method="get"
            role="search"
            aria-label="Find a business"
            className="mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl bg-white p-2 shadow-2xl sm:flex-row sm:rounded-full"
          >
            <label htmlFor="alt-q" className="sr-only">
              Business name
            </label>
            <input
              id="alt-q"
              name="q"
              type="search"
              placeholder="Search a business name"
              className="min-w-0 flex-1 rounded-full px-5 py-3 text-ink outline-none"
            />
            <label htmlFor="alt-city" className="sr-only">
              Area
            </label>
            <select
              id="alt-city"
              name="city"
              className="rounded-full border border-ink/15 px-4 py-3 text-ink"
              defaultValue=""
            >
              <option value="">All GTA</option>
              {GTA_AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button className="rounded-full bg-phred px-7 py-3 font-bold text-white hover:bg-red-dk">Search</button>
          </form>
          <div className="mt-5 flex flex-wrap items-center gap-2" data-testid="alt-popular">
            <span className="text-sm text-white/80">Popular searches:</span>
            {POPULAR.map((p) => (
              <Link
                key={p.label}
                href={p.href}
                className="rounded-full bg-white/15 px-3 py-1 text-sm font-semibold hover:bg-white/25"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="alt-cats">
        <p className="kicker" data-testid="category-tag">
          Category: {brand.category}
        </p>
        <h2 id="alt-cats" className="mt-1 text-3xl font-extrabold text-ink">
          Browse by category
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="alt-categories">
          {cats.map((c) => (
            <li key={c.slug} data-count={c.total}>
              <Link href={c.href} className="card group flex h-full flex-col p-5 hover:shadow-lg">
                <span className="text-4xl" aria-hidden="true">
                  {c.icon}
                </span>
                <strong className="mt-3 text-ink group-hover:text-sea">{c.name}</strong>
                <span className="text-sm text-muted">
                  {c.total} {c.total === 1 ? "listing" : "listings"}
                  {c.sample > 0 ? ` · ${c.sample} SAMPLE, ${c.verified} Verified tier` : " · free, unverified"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
        {coming.map((s) => (
          <p key={s.slug} className="mt-4 rounded-xl border-2 border-dashed border-ink/15 px-4 py-3 text-sm text-muted">
            <strong className="text-ink">{s.name}</strong> · coming {s.edition}
          </p>
        ))}
      </section>

      <section className="bg-sand/50" aria-labelledby="alt-featured-h">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <div className="flex flex-wrap items-end justify-between gap-2">
            <h2 id="alt-featured-h" className="text-3xl font-extrabold text-ink">
              Featured businesses
            </h2>
            <Link href="/directory" className="text-sm font-semibold text-turqdk underline">
              See the whole directory
            </Link>
          </div>
          <div className="mt-5">
            <FeaturedGrid cards={featuredForAlt()} areas={GTA_AREAS} />
          </div>
          <p className="mt-4 text-xs text-muted">Businesses marked SAMPLE are fictional, for the prototype.</p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="alt-map">
        <h2 id="alt-map" className="text-3xl font-extrabold text-ink">
          Where to find us
        </h2>
        <p className="mt-1 text-muted">
          {total} listings across {areas.length} GTA areas: SAMPLE Money &amp; Business listings plus free listings
          compiled from public information.
        </p>
        <div className="mt-3">
          <PublicNote />
        </div>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" data-testid="alt-areas">
          {areas.map((a) => (
            <li key={a.area} data-area={a.area} data-count={a.n}>
              <Link href={`/directory?city=${encodeURIComponent(a.area)}`} className="card block p-4 hover:shadow-md">
                <span className="flex items-baseline justify-between">
                  <strong className="text-ink">📍 {a.area}</strong>
                  <span className="text-sm font-bold text-turqdk">
                    {a.n} {a.n === 1 ? "listing" : "listings"}
                  </span>
                </span>
                <span className="mt-2 block h-2 rounded-full bg-sand" aria-hidden="true">
                  <span className="block h-2 rounded-full bg-turqdk" style={{ width: `${(a.n / max) * 100}%` }} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {evs.length > 0 && (
        <section className="bg-aqua/60" aria-labelledby="alt-events">
          <div className="mx-auto max-w-6xl px-4 py-14">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <h2 id="alt-events" className="text-3xl font-extrabold text-ink">
                Coming up in the community
              </h2>
              <Link href="/calendar" className="text-sm font-semibold text-turqdk underline">
                Full calendar
              </Link>
            </div>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="alt-events">
              {evs.map((e) => {
                const d = new Date(`${e.date}T12:00:00Z`);
                return (
                  <li key={e.id}>
                    <Link
                      href={`/calendar/${e.id}`}
                      className="card group block h-full overflow-hidden hover:shadow-lg"
                    >
                      <span className="flex items-center gap-3 bg-ink px-4 py-3 text-white">
                        <span className="text-2xl font-extrabold">{d.getUTCDate()}</span>
                        <span className="text-xs font-bold uppercase">
                          {d.toLocaleDateString("en-CA", { month: "long", year: "numeric", timeZone: "UTC" })}
                        </span>
                      </span>
                      <span className="block p-4">
                        <strong className="block leading-snug text-ink group-hover:text-sea">{e.name}</strong>
                        <span className="mt-1 block text-xs text-muted">
                          {e.city} · {e.catLabel}
                          {e.tier === "featured" ? " · Featured" : ""}
                          {e.sample ? " · SAMPLE" : ""}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="alt-why">
        <h2 id="alt-why" className="text-3xl font-extrabold text-ink">
          Why Pinoy Pages
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3" data-testid="alt-why">
          {WHY.map((w) => (
            <li key={w.t} className="card p-6">
              <span className="text-4xl" aria-hidden="true">
                {w.icon}
              </span>
              <h3 className="mt-3 text-xl font-bold text-ink">{w.t}</h3>
              <p className="mt-2 text-muted">{w.d}</p>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn btn-ghost" href="/list-free">
            List free
          </Link>
          <Link className="btn" href="/get-verified">
            Get Verified · $199
          </Link>
        </div>
      </section>

      <section className="bg-gradient-to-r from-turqdk to-sea" aria-labelledby="alt-news">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 md:grid-cols-2 md:items-center">
          <div className="text-white">
            <h2 id="alt-news" className="text-3xl font-extrabold">
              The monthly member email
            </h2>
            <p className="mt-2 text-white/90">
              New Verified businesses, upcoming events and tax deadlines, once a month. Sign up at pinoypages.ca or
              right here.
            </p>
          </div>
          <SignupForm />
        </div>
      </section>
    </div>
  );
}
