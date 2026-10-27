import Link from "next/link";
import { ClaimForm } from "@/components/Forms";
import { PlanTable } from "@/components/PlanTable";
import { QrSection } from "@/components/QrSection";
import { LogoTile, PartnerStars } from "@/components/Badge";
import { ListingCard } from "@/components/ListingCard";
import { adMenu, brand, listingById, money, mutualPartners, type Listing } from "@/lib/guide";

/** Social proof drawn ONLY from SAMPLE stories (fictional businesses), always labelled SAMPLE. */
const PROOF = [
  {
    id: "tax-01",
    quote:
      "My clients are careful people. They should be able to check that I'm who I say I am before they hand me their SIN.",
    story: "/magazine/meet-bituin-tax",
  },
  {
    id: "biz-01",
    quote:
      "Mutual vouching sounds like a formality until you think about what it means. I'm putting my name next to theirs.",
    story: "/magazine/meet-perlas-bookkeeping",
  },
  {
    id: "tax-04",
    quote: "Newcomers don't write online reviews. They tell their cousin.",
    story: "/magazine/kabayans-pick-preview",
  },
];

const verified = adMenu.find((o) => o.id === "verified")!;

const FREE = [
  "Name, phone and city in the directory",
  "One text line, no logo",
  "Unverified: no badge",
  "No QR, ZCard or Save contact",
];
const VERIFIED = [
  "Verified Kabayan badge + “Verified [date]” once you pass the visit",
  "Featured card with your logo, services and photos",
  "ZCard bridge page with Save contact and Call / Book",
  "Dynamic QR for cards, flyers, signs + counter card",
  "Monthly scan report: proof people found you",
  "Mutual partner stars from businesses you vouch with",
  "Printed proof copy of the Pilot Edition",
];
export const CHECKS = [
  { t: "Kabayan-owned or run", d: "A Filipino owner or operator runs the business day to day." },
  { t: "Really trading", d: "A real, operating business: we see it at a ~15-minute visit." },
  { t: "ZCard completed", d: "Your digital card is filled in and checked with you at the visit." },
  {
    t: "One mutual vouch",
    d: "A verified business vouches for you and you vouch back. Founding members are vouched for at the visit.",
  },
];

function Tick({ ok }: { ok: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-5 w-5 shrink-0" focusable="false">
      {ok ? (
        <>
          <circle cx="10" cy="10" r="10" fill="#0E7C86" />
          <path d="M6 10.3l2.6 2.6 5.4-5.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <circle cx="10" cy="10" r="9.25" fill="none" stroke="#9AA6AD" strokeWidth="1.5" />
          <path d="M6.5 10h7" stroke="#9AA6AD" strokeWidth="2" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}

/** Get Verified: comparison, the four badge checks, keeping-your-badge rules, plan table and the claim form. */
export function GetVerified({ l }: { l?: Pick<Listing, "id" | "name"> }) {
  return (
    <div className="mx-auto max-w-6xl space-y-12 px-4 py-8">
      <section aria-labelledby="compare">
        <h2 id="compare" className="text-2xl font-bold text-ink">
          Free or Verified
        </h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className="card p-6" data-testid="plan-free">
            <p className="kicker">Free</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">$0</p>
            <p className="text-sm text-muted">Unverified · name and contact only</p>
            <ul className="mt-4 space-y-2">
              {FREE.map((f, i) => (
                <li key={f} className="flex gap-2">
                  <Tick ok={i < 1} /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="card relative border-2 border-phred p-6" data-testid="plan-verified">
            <span className="absolute -top-3 right-4 rounded-md bg-phred px-2 py-0.5 text-xs font-bold text-white">
              Everything included
            </span>
            <p className="kicker">Verified</p>
            <p className="mt-1 text-3xl font-extrabold text-ink">
              {money(verified.price)} <span className="text-base font-semibold text-muted">{verified.unit}</span>
            </p>
            <p className="text-sm text-muted">Plus applicable HST. One price, everything included.</p>
            <ul className="mt-4 space-y-2">
              {VERIFIED.map((f) => (
                <li key={f} className="flex gap-2">
                  <Tick ok /> {f}
                </li>
              ))}
            </ul>
            <a href="#claimh" className="btn mt-5 w-full">
              Get Verified
            </a>
          </div>
        </div>
      </section>

      <section aria-labelledby="why" data-testid="why-verified">
        <h2 id="why" className="text-2xl font-bold text-ink">
          Why Verified
        </h2>
        <p className="mt-1 max-w-3xl text-muted">
          The same directory, two very different first impressions. This is how a free listing and a Verified listing
          look to someone searching for a tax preparer in Scarborough.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-bold text-muted">Free listing</p>
            <ul className="card px-4">{listingById("tax-02") && <ListingCard l={listingById("tax-02")!} />}</ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-bold text-muted">Verified listing</p>
            <ul>{listingById("tax-01") && <ListingCard l={listingById("tax-01")!} />}</ul>
          </div>
        </div>
        <h3 className="mt-8 text-lg font-bold text-ink">
          From our sample stories <span className="sample-chip align-middle">Sample</span>
        </h3>
        <ul className="mt-3 grid gap-4 md:grid-cols-3">
          {PROOF.map((p) => {
            const l = listingById(p.id);
            if (!l) return null;
            return (
              <li key={p.id} className="card flex flex-col p-5" data-proof={p.id}>
                <blockquote className="text-ink">“{p.quote}”</blockquote>
                <div className="mt-4 flex items-center gap-3">
                  <LogoTile l={l} size="sm" />
                  <div className="text-sm">
                    <p className="font-bold">{l.zcard?.person}</p>
                    <p className="text-muted">{l.name}</p>
                    <PartnerStars n={mutualPartners(l).length} />
                  </div>
                </div>
                <p className="mt-3 text-xs text-muted">
                  SAMPLE quote from a fictional business ·{" "}
                  <Link href={p.story} className="font-semibold text-turqdk underline">
                    Read the story
                  </Link>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="checks">
        <h2 id="checks" className="text-2xl font-bold text-ink">
          How the badge is earned: 4 checks
        </h2>
        <p className="mt-1 max-w-3xl text-muted">
          Payment never buys the badge. Verified makes you eligible; a ~15-minute visit covers checks 1–3, and one
          mutual vouch completes it.
        </p>
        <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="badge-checks">
          {CHECKS.map((c, i) => (
            <li key={c.t} className="card p-5">
              <span
                className="grid h-9 w-9 place-items-center rounded-full bg-phred font-extrabold text-white"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold text-ink">{c.t}</h3>
              <p className="mt-1 text-sm text-muted">{c.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="details">
        <h2 id="details" className="text-2xl font-bold text-ink">
          The details
        </h2>
        <div className="mt-4">
          <PlanTable />
        </div>
      </section>

      <section aria-labelledby="claimh" className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div>
          <h2 id="claimh" className="text-2xl font-bold text-ink">
            Claim your listing
          </h2>
          <p className="mt-2 text-muted">
            Tell us who you are and choose Free or Verified. We reply by email to book your ~15-minute visit. Nothing is
            charged online.
          </p>
          <p className="mt-3 text-sm text-muted">
            Not ready? Browse the{" "}
            <Link href="/directory" className="font-semibold text-turqdk underline">
              directory
            </Link>{" "}
            or contact {brand.email}.
          </p>
        </div>
        <ClaimForm listing={l?.id} listingName={l?.name} />
      </section>
      {l && <QrSection l={l} />}
    </div>
  );
}
