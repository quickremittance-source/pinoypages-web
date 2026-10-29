import { AreaChips, Empty, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { RestaurantFilter } from "@/components/foodie/client";
import { areaCounts, getRestaurants } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Restaurants in the GTA",
  "Filipino restaurants across the Greater Toronto Area (GTA), by area and dish.",
  "/restaurants",
);

export default async function Restaurants() {
  const [rs, counts] = await Promise.all([getRestaurants(), areaCounts()]);
  return (
    <>
      <PageTitle title="Filipino restaurants in the GTA" />
      <AreaChips counts={counts} />
      <ZcardSlot slot="list-top" />
      {rs.length ? (
        <RestaurantFilter
          items={rs.map((r) => ({
            slug: r.slug,
            name: r.name,
            meta: [r.neighbourhood, r.city].filter(Boolean).join(" · "),
            dishes: r.dishSlugs,
          }))}
        />
      ) : (
        <Empty>Restaurant listings are being added.</Empty>
      )}
    </>
  );
}
