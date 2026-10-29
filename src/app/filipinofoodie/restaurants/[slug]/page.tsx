import Link from "next/link";
import { notFound } from "next/navigation";
import { AiBadge, Empty, FF, RestaurantCard, ScoreBars, ZcardSlot } from "@/components/foodie/ui";
import { JsonLd } from "@/components/JsonLd";
import { getEvaluation, getMenu, getRestaurant, getRestaurants, getVideos } from "@/lib/foodie/data";
import { areaName } from "@/lib/foodie/areas";
import { SITE_URL } from "@/lib/guide";
import { ffMeta } from "../../meta";

export const revalidate = 86400;
export const generateStaticParams = async () => (await getRestaurants()).map((r) => ({ slug: r.slug }));

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  const r = await getRestaurant((await params).slug);
  if (!r) return {};
  const where = r.area ? areaName(r.area) : (r.city ?? "GTA");
  return ffMeta(
    `${r.name}, Filipino Food in ${where}`,
    `${r.name}: Filipino food in ${where}, GTA.`,
    `/restaurants/${r.slug}`,
  );
}

const STALE_DAYS = 90;

export default async function Profile({ params }: P) {
  const { slug } = await params;
  const r = await getRestaurant(slug);
  if (!r) notFound();
  const [ev, menu, all, videos] = await Promise.all([
    getEvaluation(slug),
    getMenu(slug),
    getRestaurants(),
    getVideos(),
  ]);
  const nearby = all.filter((x) => x.area && x.area === r.area && x.slug !== slug).slice(0, 4);
  const vids = videos.filter((v) => v.restaurantSlugs.includes(slug));
  const now = Date.now();
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Restaurant",
          name: r.name,
          servesCuisine: "Filipino",
          url: `${SITE_URL}/filipinofoodie/restaurants/${slug}`,
          ...(r.address ? { address: r.address } : {}),
          ...(r.phone ? { telephone: r.phone } : {}),
        }}
      />
      <header className="py-6">
        <h1 className="font-display text-3xl font-bold text-sea">{r.name}</h1>
        <p className="text-muted">{[r.address, r.neighbourhood].filter(Boolean).join(" · ")}</p>
        {r.phone ? <p className="text-sm">Phone: {r.phone}</p> : null}
        {r.website ? (
          <a className="text-sm text-turqdk underline" href={r.website} rel="nofollow noopener" target="_blank">
            Website
          </a>
        ) : null}
        {r.status.startsWith("open") ? null : (
          <p className="mt-1 text-sm text-muted">Listing not yet verified. Please call ahead.</p>
        )}
      </header>
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <section className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-xl font-bold">
              <AiBadge /> AI evaluation
            </h2>
            {ev ? (
              <>
                {ev.summary ? <p className="mb-4">{ev.summary}</p> : null}
                <ScoreBars scores={ev.scores} />
                {ev.love ? (
                  <p className="mt-4 text-sm">
                    <strong>What people love:</strong> {ev.love}
                  </p>
                ) : null}
                {ev.complaints ? (
                  <p className="mt-2 text-sm">
                    <strong>Common complaints:</strong> {ev.complaints}
                  </p>
                ) : null}
                {ev.dishes ? (
                  <p className="mt-2 text-sm">
                    <strong>Signature dishes:</strong> {ev.dishes}
                  </p>
                ) : null}
                <p className="mt-3 text-xs text-muted">AI-generated evaluation, last updated {ev.evaluatedAt}.</p>
              </>
            ) : (
              <p className="text-muted">No AI evaluation yet.</p>
            )}
          </section>
          <section>
            <h2 className="mb-2 text-xl font-bold">Menu</h2>
            {menu.length ? (
              <ul className="card divide-y divide-sand">
                {menu.map((m) => {
                  const stale = now - Date.parse(m.confirmedAt) > STALE_DAYS * 864e5;
                  return (
                    <li key={m.name} className={`flex justify-between p-3 ${stale ? "text-muted opacity-60" : ""}`}>
                      <span>{m.name}</span>
                      <span>
                        ${m.price.toFixed(2)} <span className="text-xs">(confirmed {m.confirmedAt})</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty>
                The owner hasn&apos;t confirmed menu prices yet. Please contact the restaurant for current prices.
              </Empty>
            )}
          </section>
          {vids.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Videos</h2>
              <ul>
                {vids.map((v) => (
                  <li key={v.youtubeId}>
                    <Link className="text-turqdk underline" href={`${FF}/videos/${v.youtubeId}`}>
                      {v.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {nearby.length ? (
            <section>
              <h2 className="mb-2 text-xl font-bold">Nearby</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {nearby.map((x) => (
                  <RestaurantCard key={x.slug} r={x} />
                ))}
              </ul>
            </section>
          ) : null}
          <ZcardSlot slot="profile-bottom" area={r.area} index={1} />
        </div>
        <div className="space-y-4">
          <ZcardSlot slot="profile-sidebar" area={r.area} size="sidebar" />
          <div className="card p-4">
            <h2 className="font-bold">Is this your business?</h2>
            <p className="mt-1 text-sm">Claim it to correct details and confirm your menu prices.</p>
            <Link href={`${FF}/claim`} className="btn mt-2 px-3 py-1.5 text-sm">
              Claim this listing
            </Link>
          </div>
        </div>
      </div>
      {ev?.thirdParty.length ? (
        <p className="mt-8 text-[11px] text-muted">
          Third-party ratings:{" "}
          {ev.thirdParty
            .map(
              (t) =>
                `${t.source} ${t.value}${t.count ? ` (${t.count} reviews)` : ""}${t.checked_at ? `, checked ${t.checked_at}` : ""}`,
            )
            .join("; ")}
          . Ratings belong to their sources and are not Filipino Foodie ratings.
        </p>
      ) : null}
    </>
  );
}
