import { LogoTile, PartnerStars, SampleChip, VerifiedKabayan, ZCardMark } from "@/components/Badge";
import { badgeState, brand, mutualPartners, shortDate, type Listing } from "@/lib/guide";

/**
 * ZCard bridge: the person behind a Verified listing. QR scans land here (/go/<id> → /card/<id>). By design it has
 * NO form, NO login, NO payment and asks for NO personal data: only Save contact and Call. Anything that asks for
 * more is not us. Links inside are limited to /vcard/, /go/ (counted) and mailto: (report).
 */
export function ZCardBridge({ l, standalone = false }: { l: Listing; standalone?: boolean }) {
  const z = l.zcard;
  const state = badgeState(l);
  const partners = mutualPartners(l);
  const H = standalone ? "h1" : "h2";
  return (
    <section
      id="zcard"
      data-testid="zcard-bridge"
      data-state={state}
      aria-labelledby="zcard-h"
      className="card overflow-hidden"
    >
      <div className={`h-1.5 ${state === "active" ? "bg-phred" : "bg-sand"}`} aria-hidden="true" />
      <div className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <p className="kicker">ZCard{l.sample ? " · Sample" : ""}</p>
          <ZCardMark />
        </div>
        <div className="mt-4 flex items-center gap-4">
          <LogoTile l={l} size="lg" />
          <div className="min-w-0">
            <H id="zcard-h" className={`${standalone ? "text-2xl" : "text-xl"} leading-tight font-extrabold text-ink`}>
              {z?.person ?? l.name}
            </H>
            {z && <p className="text-sm text-muted">{z.role}</p>}
            <p className="mt-0.5 font-semibold text-sea">
              {l.name} {l.sample && <SampleChip />}
            </p>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-aqua/70 p-3">
          {state === "active" ? (
            <div className="space-y-1.5">
              <VerifiedKabayan l={l} withDate />
              <p className="text-xs text-muted">
                Visited in person and vouched for by a verified business. Valid 12 months from{" "}
                {shortDate(l.verifiedOn!)}.
              </p>
            </div>
          ) : state === "paused" ? (
            <p className="text-sm font-bold text-red-dk" data-testid="vk-paused">
              Badge paused pending review{l.badge?.pausedReason ? ` (${l.badge.pausedReason.toLowerCase()})` : ""}.
            </p>
          ) : state === "expired" ? (
            <p className="text-sm font-bold text-ink" data-testid="vk-expired">
              Badge expired: last verified {shortDate(l.verifiedOn!)}. Renew for the light re-check to restore it.
            </p>
          ) : (
            <p className="text-sm font-bold text-ink" data-testid="verification-pending">
              Verification pending: no badge until the visit is passed and one mutual vouch is confirmed.
            </p>
          )}
        </div>

        {state === "active" && partners.length > 0 && (
          <div className="mt-4">
            <PartnerStars n={partners.length} testId="partner-stars" />
            <ul className="mt-1 text-sm" aria-label="Mutual partners">
              {partners.map((p) => (
                <li key={p.id}>
                  {p.name} <span className="text-muted">· {p.area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-sm text-muted">
          {l.area} · Languages: {l.languages}
        </p>
        {l.hours && <p className="mt-1 text-sm text-muted">Hours: {l.hours}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <a className="btn" href={`/go/${l.id}?via=call`}>
            Call / Book
          </a>
          <a className="btn btn-teal" href={`/vcard/${l.id}.vcf`} download>
            Save contact
          </a>
          <a className="btn btn-ghost" href={`/go/${l.id}?via=map`}>
            Directions
          </a>
          {l.website && (
            <a className="btn btn-ghost" href={`/go/${l.id}?via=web`} rel="nofollow">
              Website
            </a>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-turqdk/30 p-3 text-sm">
          <p className="flex items-start gap-2 font-bold text-sea">
            <svg aria-hidden="true" viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" focusable="false">
              <path d="M10 1.5l7 2.6v5c0 4.4-3 7.8-7 9.4-4-1.6-7-5-7-9.4v-5z" fill="#0E7C86" />
              <path d="M6.8 10l2.1 2.1 4.3-4.3" fill="none" stroke="#fff" strokeWidth="1.8" />
            </svg>
            {brand.qrLine}
          </p>
          <p className="mt-1 text-muted">{brand.bridgeRule}</p>
          <p className="mt-1">
            <a
              className="font-semibold text-turqdk underline"
              href={`mailto:${brand.email}?subject=${encodeURIComponent(`Report this QR: ${l.id}`)}`}
            >
              Report this QR
            </a>
          </p>
        </div>
      </div>
    </section>
  );
}
