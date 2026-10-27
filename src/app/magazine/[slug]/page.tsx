import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleView } from "@/components/ArticleView";
import { articleBySlug, listedArticles, readArticle } from "@/lib/magazine";

export const dynamicParams = false;
export function generateStaticParams() {
  return listedArticles.map((a) => ({ slug: a.slug }));
}
type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { slug } = await params;
  const a = articleBySlug(slug);
  if (!a) return {};
  const { meta } = readArticle(a);
  return {
    title: a.title,
    description: meta.meta_description,
    alternates: { canonical: `/magazine/${slug}`, languages: a.tl ? { tl: `/magazine/${slug}/tl` } : undefined },
  };
}
export default async function Page({ params }: P) {
  const a = articleBySlug((await params).slug);
  if (!a) notFound();
  return <ArticleView a={a} lang="en" />;
}
