import { VerifiedKabayan, ZCardMark } from "@/components/Badge";
import { brand, isFeatured, isVerified, type Listing } from "@/lib/guide";

/**
 * ZCard bridge: the person behind a paid listing. QR scans land here. By design it has NO form, NO login, NO payment
 * and asks for NO personal data: only Save contact and Call. Anything that asks for more is not us.
 */
export function ZCardBridge({ l }: { l: Listing }) {
  const z = l.zcard;
  const initials = (z?.person ?? l.name)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("");
  return (
    <section
      id="zcard"
      data-testid="zcard-bridge"
      aria-labelledby="zcard-h"
      className="mt-6 rounded-2xl border-2 border-turqdk bg-white p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="zcard-h" className="text-xl font-semibold text-sea">
          ZCard: the person behind {l.name}
        </h2>
        <ZCardMark />
      </div>
      <div className="mt-4 flex items-start gap-4">
        <span
          aria-hidden="true"
          className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-sea text-xl font-bold text-white"
        >
          {initials}
        </span>
        <div>
          {z && (
            <p className="font-bold">
              {z.person} · <span className="font-normal">{z.role}</span>
            </p>
          )}
          <p className="text-sm">Languages: {l.languages}</p>
          <p className="mt-2">
            {isVerified(l) ? (
              <VerifiedKabayan l={l} withDate />
            ) : (
              <span className="text-sm font-bold text-ink" data-testid="verification-pending">
                Verification visit pending: no badge until the visit is passed.
              </span>
            )}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <a className="btn bg-sea" href={`/vcard/${l.id}.vcf`} download>
          Save contact
        </a>
        {isFeatured(l) && (
          <a className="btn" href={`/go/${l.id}?via=call`}>
            Call / Book
          </a>
        )}
      </div>
      <div className="mt-4 rounded-lg bg-aqua p-3 text-sm text-sea">
        <p className="font-bold">{brand.qrLine}</p>
        <p>{brand.bridgeRule}</p>
        <p>
          <a
            className="underline"
            href={`mailto:${brand.email}?subject=${encodeURIComponent(`Report this QR: ${l.id}`)}`}
          >
            Report this QR
          </a>
        </p>
      </div>
    </section>
  );
}
