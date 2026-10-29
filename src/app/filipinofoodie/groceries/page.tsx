import { Empty, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Groceries in the GTA",
  "Filipino groceries across the Greater Toronto Area (GTA).",
  "/groceries",
);

export default function Page() {
  return (
    <>
      <PageTitle title="Filipino groceries in the GTA" />
      <ZcardSlot slot="groceries-top" />
      <Empty>We&apos;re verifying groceries listings before publishing them. Own one? Claim your free listing.</Empty>
    </>
  );
}
