import { Empty, PageTitle, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { getRestaurants, isGrocery } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Groceries in the GTA",
  "Filipino groceries across the Greater Toronto Area (GTA).",
  "/groceries",
);

export default async function Page() {
  const rs = (await getRestaurants()).filter(isGrocery);
  return (
    <>
      <PageTitle
        title="Filipino groceries in the GTA"
        intro={rs.length ? `${rs.length} listings. Please call ahead to confirm details.` : undefined}
      />
      <ZcardSlot slot="groceries-top" />
      {rs.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rs.map((r) => (
            <RestaurantCard key={r.slug} r={r} />
          ))}
        </ul>
      ) : (
        <Empty>We&apos;re verifying groceries listings before publishing them. Own one? Claim your free listing.</Empty>
      )}
    </>
  );
}
