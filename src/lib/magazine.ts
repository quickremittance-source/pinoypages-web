import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import data from "../../content/guide.json";

/** Magazine articles: Markdown files in content/magazine (EN + TL), listed in guide.json `articles`. */
export type Article = {
  n: number;
  slug: string;
  file: string;
  title: string;
  tl: boolean;
  /** SAMPLE stories (pilot prototype): byline, kind, season, linked sample listings and tools. */
  sample?: boolean;
  kind?: "profile" | "how-to" | "community";
  season?: "spring" | "summer" | "fall";
  listings?: string[];
  tools?: string[];
  dek?: string;
  author?: string;
};
export const articles = data.articles as Article[];
export const sampleStories = articles.filter((a) => a.sample);
export const editionArticles = articles.filter((a) => !a.sample);
export const KIND_LABEL = {
  profile: "Meet the Verified Kabayan",
  "how-to": "Money how-to",
  community: "Community",
} as const;
export const articleBySlug = (slug: string) => articles.find((a) => a.slug === slug);

export function readArticle(a: Article, lang: "en" | "tl" = "en") {
  const raw = readFileSync(path.join(process.cwd(), "content", "magazine", `${a.file}.${lang}.md`), "utf8");
  const fm = /^---\n([\s\S]*?)\n---\n/.exec(raw);
  const meta: Record<string, string> = {};
  for (const line of (fm?.[1] ?? "").split("\n")) {
    const m = /^(\w+):\s*"?(.*?)"?$/.exec(line);
    if (m?.[1]) meta[m[1]] = m[2] ?? "";
  }
  const body = (fm ? raw.slice(fm[0].length) : raw).replace(/^# .+\n/m, "");
  // Task-list checkboxes become plain boxes (read-only, no unlabeled inputs).
  const html = marked.parse(body, { async: false }).replace(/<input[^>]*type="checkbox"[^>]*>/g, "☐");
  return { meta, html };
}

/** Word count of an article body (Markdown, front matter removed). */
export function wordCount(a: Article) {
  const raw = readFileSync(path.join(process.cwd(), "content", "magazine", `${a.file}.en.md`), "utf8");
  return raw
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .split(/\s+/)
    .filter(Boolean).length;
}
