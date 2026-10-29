import Link from "next/link";
import { AreaChips, Empty, FF, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { NearYou } from "@/components/foodie/client";
import { areaCounts, getDishes, getRestaurants, getVideos } from "@/lib/foodie/data";
import { ffMeta } from "./meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Food in the GTA | Restaurants, Lechon & Catering",
  "Find Filipino restaurants, dishes, delicacies, catering and groceries across the Greater Toronto Area (GTA).",
  "",
);

export default async function FoodieHome() {
  const [rs, counts, dishes, videos] = await Promise.all([getRestaurants(), areaCounts(), getDishes(), getVideos()]);
  const featured = rs.filter((r) => r.overall != null).slice(0, 6);
  return (
    <>
      <section className="py-8">
        <h1 className="font-display text-3xl font-bold text-sea sm:text-5xl">Filipino food in the GTA</h1>
        <p className="mt-2 max-w-2xl text-lg text-muted">
          Restaurants, dishes, delicacies, catering and Filipino groceries from Toronto to Durham.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href={`${FF}/restaurants`} className="btn">
            Browse restaurants
          </Link>
          <Link href={`${FF}/dish`} className="btn-ghost btn">
            Find a dish
          </Link>
        </div>
        <AreaChips counts={counts} />
      </section>
      <ZcardSlot slot="home-top" />
      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        <div>
          <h2 className="mb-3 text-xl font-bold">Featured restaurants</h2>
          {featured.length ? (
            <ul className="grid gap-3 sm:grid-cols-2">
              {featured.map((r) => (
                <RestaurantCard key={r.slug} r={r} />
              ))}
            </ul>
          ) : (
            <Empty>Restaurant listings are being added.</Empty>
          )}
          <h2 className="mt-8 mb-3 text-xl font-bold">Popular dishes</h2>
          {dishes.length ? (
            <ul className="flex flex-wrap gap-2">
              {dishes.slice(0, 20).map((d) => (
                <li key={d.slug}>
                  <Link href={`${FF}/dish/${d.slug}`} className="inline-block rounded-full bg-aqua px-3 py-1 text-sm">
                    {d.name}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Dish guides are coming soon.</Empty>
          )}
          <h2 className="mt-8 mb-3 text-xl font-bold">Latest videos</h2>
          {videos.length ? (
            <ul className="grid gap-3 sm:grid-cols-3">
              {videos.slice(0, 3).map((v) => (
                <li key={v.youtubeId}>
                  <Link href={`${FF}/videos/${v.youtubeId}`} className="font-semibold text-sea hover:underline">
                    {v.title}
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>Video reviews are coming soon.</Empty>
          )}
        </div>
        <div className="space-y-4">
          <NearYou />
          <ZcardSlot slot="home-mid" size="sidebar" index={1} />
          <div className="card p-4">
            <h2 className="font-bold">Own a Filipino food business?</h2>
            <p className="mt-1 text-sm">Claim your free listing and confirm your menu and prices.</p>
            <Link href={`${FF}/claim`} className="btn mt-2 px-3 py-1.5 text-sm">
              Claim your listing
            </Link>
          </div>
        </div>
      </div>
      <ZcardSlot slot="home-bottom" index={2} />
    </>
  );
}
