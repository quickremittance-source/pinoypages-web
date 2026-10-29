import { Empty, PageTitle, ZcardSlot } from "@/components/foodie/ui";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Delicacies in the GTA",
  "Filipino delicacies across the Greater Toronto Area (GTA).",
  "/delicacies",
);

export default function Page() {
  return (
    <>
      <PageTitle title="Filipino delicacies in the GTA" />
      <ZcardSlot slot="delicacies-top" />
      <Empty>We&apos;re verifying delicacies listings before publishing them. Own one? Claim your free listing.</Empty>
    </>
  );
}
