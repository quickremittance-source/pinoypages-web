import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/Chrome";
import { SimpleTable } from "@/components/admin/Tables";
import { ADV_TIER_LABEL, listAdvertisers } from "@/lib/advertisers";
import { validAdminKey } from "@/lib/analytics/token";
import { listPlacements, SPONSORED_PRICE, sponsoredSlots } from "@/lib/sponsored";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · advertisers", robots: { index: false, follow: false } };

/** Advertisers in Neon with their private stats links. Needs ?key=ADMIN_KEY; 404 otherwise. */
export default async function Page({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!validAdminKey(key)) notFound();
  const list = await listAdvertisers().catch((e) => {
    console.warn("[admin] advertisers failed", (e as Error).message);
    return null;
  });
  const placements = await listPlacements().catch(() => null);
  const names = new Map((list ?? []).map((a) => [a.id, a.business_name]));
  return (
    <>
      <PageHead kicker="Admin" title="Advertisers" intro="Private. Share each stats link only with that advertiser." />
      <div className="mx-auto max-w-6xl space-y-4 px-4 py-8">
        {!list ? (
          <p className="text-muted">Advertisers live in the Neon database (DATABASE_URL); none configured here.</p>
        ) : (
          <SimpleTable
            label="Advertisers"
            head={["Business", "Contact", "Plan", "Ad sizes", "Status", "Dates", "Listings", "Ads", "Stats link"]}
            rows={list.map((a) => [
              `${a.business_name}${a.is_demo ? " [DEMO]" : ""}`,
              [a.contact_name, a.contact_email, a.contact_phone].filter(Boolean).join(" · ") || "—",
              ADV_TIER_LABEL[a.tier] ?? a.tier,
              a.ad_sizes.join(", ") || "—",
              a.status,
              `${a.start_date ?? "—"} → ${a.end_date ?? "—"}`,
              a.listing_ids.join(", ") || "—",
              a.ads.map((x) => `${x.slug} (${x.tier}, ${x.status})`).join(", ") || "—",
              `/stats/${a.stats_token}`,
            ])}
          />
        )}
        <h2 className="pt-4 text-xl font-bold text-ink">Sponsored search placements</h2>
        <p className="text-sm text-muted">
          {SPONSORED_PRICE}. Up to {sponsoredSlots()} Sponsored results per search (SPONSORED_SLOTS).
        </p>
        {placements && (
          <SimpleTable
            label="Sponsored search placements"
            head={["Advertiser", "Title", "Target", "Keywords", "Categories", "Dates", "Active"]}
            rows={placements.map((p) => [
              `${names.get(p.advertiser_id) ?? p.advertiser_id}${p.is_demo ? " [DEMO]" : ""}`,
              p.title,
              p.href,
              p.keywords.join(", ") || "—",
              p.categories.join(", ") || "—",
              `${p.start_date ?? "—"} → ${p.end_date ?? "—"}`,
              p.active ? "yes" : "no",
            ])}
          />
        )}
        <p>
          <a className="underline" href={`/admin/analytics?key=${encodeURIComponent(key!)}`}>
            Site analytics
          </a>{" "}
          ·{" "}
          <a className="underline" href={`/admin/ads?key=${encodeURIComponent(key!)}`}>
            Ads
          </a>
        </p>
      </div>
    </>
  );
}
