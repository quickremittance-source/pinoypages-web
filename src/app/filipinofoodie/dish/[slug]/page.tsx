import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, FF, PageTitle, RestaurantCard, ZcardSlot } from "@/components/foodie/ui";
import { getDishes, getRestaurants, getVideos } from "@/lib/foodie/data";
import { ffMeta } from "../../meta";

export const revalidate = 86400;
export const generateStaticParams = async () => (await getDishes()).map((d) => ({ slug: d.slug }));
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  const { slug } = await params;
  const d = (await getDishes()).find((x) => x.slug === slug);
  return d
    ? ffMeta(`Where to eat ${d.name} in the GTA`, `Filipino restaurants serving ${d.name} in the GTA.`, `/dish/${slug}`)
    : {};
}

export default async function DishPage({ params }: P) {
  const { slug } = await params;
  const d = (await getDishes()).find((x) => x.slug === slug);
  if (!d) notFound();
  const [rs, vs] = await Promise.all([getRestaurants(), getVideos()]);
  const where = rs.filter((r) => r.dishSlugs.includes(slug));
  const vids = vs.filter((v) => v.dishSlug === slug);
  return (
    <>
      <PageTitle title={`Where to eat ${d.name} in the GTA`} intro={d.description ?? undefined} />
      <ZcardSlot slot="dish-top" />
      {where.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {where.map((r) => (
            <RestaurantCard key={r.slug} r={r} />
          ))}
        </ul>
      ) : (
        <Empty>No restaurants are linked to this dish yet.</Empty>
      )}
      {vids.length ? (
        <ul className="mt-6">
          {vids.map((v) => (
            <li key={v.youtubeId}>
              <Link className="text-turqdk underline" href={`${FF}/videos/${v.youtubeId}`}>
                {v.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <ZcardSlot slot="dish-bottom" index={1} />
    </>
  );
}
