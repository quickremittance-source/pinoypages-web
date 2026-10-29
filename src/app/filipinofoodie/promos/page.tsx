import { Empty, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { ffMeta } from "../meta";

export const revalidate = 3600;
export const metadata = ffMeta(
  "Filipino Food Deals in the GTA",
  "Current deals from Filipino restaurants in the GTA.",
  "/promos",
);

/** Promos auto-expire (ends_at); none are live yet. */
export default function Promos() {
  return (
    <>
      <PageTitle title="Deals and promos" />
      <div className="grid gap-3 sm:grid-cols-2">
        <ZcardSlot slot="promo-featured-1" />
        <ZcardSlot slot="promo-featured-2" index={1} />
      </div>
      <Empty>No current promos. Restaurant owners can add deals after claiming their listing.</Empty>
    </>
  );
}
