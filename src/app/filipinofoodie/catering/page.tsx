import { Empty, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Catering in the GTA",
  "Filipino catering across the Greater Toronto Area (GTA).",
  "/catering",
);

export default function Page() {
  return (
    <>
      <PageTitle title="Filipino catering in the GTA" />
      <ZcardSlot slot="catering-top" />
      <Empty>We&apos;re verifying catering listings before publishing them. Own one? Claim your free listing.</Empty>
    </>
  );
}
