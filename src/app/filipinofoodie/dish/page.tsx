import Link from "next/link";
import { Empty, FF, PageTitle } from "@/components/foodie/ui";
import { getDishes } from "@/lib/foodie/data";
import { ffMeta } from "../meta";

export const revalidate = 86400;
export const metadata = ffMeta(
  "Filipino Dishes in the GTA",
  "Where to eat Filipino dishes in the Greater Toronto Area (GTA).",
  "/dish",
);

export default async function Dishes() {
  const ds = await getDishes();
  return (
    <>
      <PageTitle title="Filipino dishes" intro="Pick a dish to see where to eat it in the GTA." />
      {ds.length ? (
        <ul className="flex flex-wrap gap-2">
          {ds.map((d) => (
            <li key={d.slug}>
              <Link href={`${FF}/dish/${d.slug}`} className="inline-block rounded-full bg-aqua px-3 py-1">
                {d.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <Empty>Dish guides are coming soon.</Empty>
      )}
    </>
  );
}
