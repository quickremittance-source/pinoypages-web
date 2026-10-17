import "server-only";
import { readFileSync } from "node:fs";
import path from "node:path";
import { marked } from "marked";
import data from "../../content/guide.json";

/** Magazine articles: Markdown files in content/magazine (EN + TL), listed in guide.json `articles`. */
export type Article = (typeof data.articles)[number];
export const articles: Article[] = data.articles;
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
