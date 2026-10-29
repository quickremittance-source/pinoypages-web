import { notFound } from "next/navigation";
import { AreaChips, Empty, PageTitle, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { AREAS, areaName } from "@/lib/foodie/areas";
import { areaCounts, getRestaurants } from "@/lib/foodie/data";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/guide";
import { ffMeta } from "../../meta";

export const revalidate = 86400;
export const dynamicParams = false;
export const generateStaticParams = () => AREAS.map((a) => ({ area: a.slug }));

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  const n = areaName(area);
  return ffMeta(
    `Filipino Food in ${n} | Restaurants, Lechon & Catering`,
    `Filipino restaurants, lechon, catering and groceries in ${n}, GTA.`,
    `/gta/${area}`,
  );
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const { area } = await params;
  if (!AREAS.some((a) => a.slug === area)) notFound();
  const [rs, counts] = await Promise.all([getRestaurants(), areaCounts()]);
  const here = rs.filter((r) => r.area === area);
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Filipino restaurants in ${areaName(area)}`,
          itemListElement: here.map((r, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE_URL}/filipinofoodie/restaurants/${r.slug}`,
            name: r.name,
          })),
        }}
      />
      <PageTitle
        title={`Filipino food in ${areaName(area)}`}
        intro={`${here.length} listings in ${areaName(area)}, GTA.`}
      />
      <AreaChips counts={counts} active={area} />
      <ZcardSlot slot="area-top" area={area} />
      {here.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {here
            .map((r) => <RestaurantCard key={r.slug} r={r} />)
            .flatMap((el, i) =>
              i > 0 && i % 6 === 0
                ? [
                    <li key={`z${i}`} className="sm:col-span-2">
                      <ZcardSlot slot={`list-inline-${i / 6}`} area={area} index={i / 6} />
                    </li>,
                    el,
                  ]
                : [el],
            )}
        </ul>
      ) : (
        <Empty>No listings in this area yet.</Empty>
      )}
    </>
  );
}
