import { Empty, PageTitle, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { getRestaurants, isDelicacy } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Delicacies in the GTA",
  "Filipino delicacies across the Greater Toronto Area (GTA).",
  "/delicacies",
);

export default async function Page() {
  const rs = (await getRestaurants()).filter(isDelicacy);
  return (
    <>
      <PageTitle
        title="Filipino delicacies in the GTA"
        intro={rs.length ? `${rs.length} listings. Please call ahead to confirm details.` : undefined}
      />
      <ZcardSlot slot="delicacies-top" />
      {rs.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {rs.map((r) => (
            <RestaurantCard key={r.slug} r={r} />
          ))}
        </ul>
      ) : (
        <Empty>
          We&apos;re verifying delicacies listings before publishing them. Own one? Claim your free listing.
        </Empty>
      )}
    </>
  );
}
