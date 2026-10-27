import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { articleBySlug, listedArticles } from "@/lib/magazine";

export const dynamicParams = false;
export function generateStaticParams() {
  return listedArticles.filter((a) => a.tl).map((a) => ({ slug: a.slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  return { title: `${articleBySlug(slug)?.title} (Tagalog)`, alternates: { canonical: `/magazine/${slug}/tl` } };
}
export default async function Page({ params }: P) {
  const a = articleBySlug((await params).slug);
  if (!a?.tl) notFound();
  return <ArticleView a={a} lang="tl" />;
}
