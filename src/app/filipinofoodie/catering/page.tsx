import { Empty, PageTitle, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { getRestaurants, isCatering } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Catering in the GTA",
  "Filipino catering across the Greater Toronto Area (GTA).",
  "/catering",
);

export default async function Page() {
  const rs = (await getRestaurants()).filter(isCatering);
  return (
    <>
      <PageTitle
        title="Filipino catering in the GTA"
        intro={rs.length ? `${rs.length} listings. Please call ahead to confirm details.` : undefined}
      />
      <ZcardSlot slot="catering-top" />
      {rs.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rs.map((r) => (
            <RestaurantCard key={r.slug} r={r} />
          ))}
        </ul>
      ) : (
        <Empty>We&apos;re verifying catering listings before publishing them. Own one? Claim your free listing.</Empty>
      )}
    </>
  );
}
