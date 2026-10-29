import "server-only";
import { unstable_cache } from "next/cache";
import { db } from "@/lib/db";
import { events } from "@/lib/guide";
import { articles } from "@/lib/magazine";
import { publicListings } from "@/lib/public";
import { bizPath, catName } from "@/lib/seo";
import { listZcards } from "@/lib/adsRepo";

export type SearchKind = "listing" | "event" | "article" | "zcard";
export type SearchHit = { kind: SearchKind; title: string; href: string; meta: string };
export type SearchInput = { q: string; category: string; city: string };
export const KIND_LABEL: Record<SearchKind, string> = {
  listing: "Business",
  event: "Event",
  article: "Magazine",
  zcard: "zcard",
};
const LIMIT = 30;

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
const matches = (q: string, ...fields: (string | undefined | null)[]) => {
  const hay = norm(fields.filter(Boolean).join(" "));
  return norm(q)
    .split(/\s+/)
    .filter(Boolean)
    .every((t) => hay.includes(t));
};
const listingHref = (id: string) => (id.startsWith("pub-") ? bizPath({ id } as never) : `/listing/${id}`);

/** File fallback for listings and events (used when DATABASE_URL is unset or Neon fails). */
function fileListings({ q, category, city }: SearchInput): SearchHit[] {
  return publicListings
    .filter((l) => (!category || l.category === category) && (!city || l.area === city))
    .filter((l) => matches(q, l.name, catName(l.category), l.area, l.address))
    .slice(0, LIMIT)
    .map((l) => ({ kind: "listing", title: l.name, href: bizPath(l), meta: `${catName(l.category)} · ${l.area}` }));
}
function fileEvents({ q, city }: SearchInput): SearchHit[] {
  return events
    .filter((e) => !e.sample && (!city || e.city === city))
    .filter((e) => matches(q, e.name, e.place, e.city, e.description, e.organizer))
    .slice(0, LIMIT)
    .map((e) => ({
      kind: "event",
      title: e.name,
      href: `/calendar/${e.id}`,
      meta: [e.date, e.city].filter(Boolean).join(" · "),
    }));
}

async function dbListingsEvents(i: SearchInput): Promise<SearchHit[] | null> {
  const sql = db();
  if (!sql) return null;
  try {
    const [ls, es] = await Promise.all([
      sql.query(
        `select id, name, category, area from listings
         where ($2 = '' or category = $2) and ($3 = '' or area = $3)
           and (search_tsv @@ websearch_to_tsquery('simple', $1) or name % $1 or name ilike '%' || $1 || '%')
         order by ts_rank(search_tsv, websearch_to_tsquery('simple', $1)) desc, similarity(name, $1) desc limit ${LIMIT}`,
        [i.q, i.category, i.city],
      ),
      i.category
        ? Promise.resolve([])
        : sql.query(
            `select id, name, to_char(date,'YYYY-MM-DD') date, data->>'city' city from events
             where coalesce((data->>'sample')::boolean, false) = false and ($2 = '' or data->>'city' = $2)
               and (search_tsv @@ websearch_to_tsquery('simple', $1) or name % $1 or name ilike '%' || $1 || '%')
             order by ts_rank(search_tsv, websearch_to_tsquery('simple', $1)) desc limit ${LIMIT}`,
            [i.q, i.city],
          ),
    ]);
    return [
      ...(ls as { id: string; name: string; category: string; area: string }[]).map((l) => ({
        kind: "listing" as const,
        title: l.name,
        href: listingHref(l.id),
        meta: [catName(l.category ?? ""), l.area].filter(Boolean).join(" · "),
      })),
      ...(es as { id: string; name: string; date: string; city: string | null }[]).map((e) => ({
        kind: "event" as const,
        title: e.name,
        href: `/calendar/${e.id}`,
        meta: [e.date, e.city].filter(Boolean).join(" · "),
      })),
    ];
  } catch (e) {
    console.warn("[search] db failed, using files", (e as Error).message);
    return null;
  }
}

async function run(i: SearchInput): Promise<SearchHit[]> {
  if (!i.q) return [];
  const le = (await dbListingsEvents(i)) ?? [...fileListings(i), ...(i.category ? [] : fileEvents(i))];
  const extra: SearchHit[] = [];
  if (!i.category && !i.city) {
    extra.push(
      ...articles
        .filter((a) => !a.sample && matches(i.q, a.title, a.dek))
        .map((a) => ({ kind: "article" as const, title: a.title, href: `/magazine/${a.slug}`, meta: "Magazine" })),
    );
  }
  // zcard pages are universal (not region-limited), so the city filter doesn't hide them.
  if (!i.category) {
    const z = await listZcards().catch(() => []);
    extra.push(
      ...z
        .filter((a) => !(process.env.VERCEL_ENV === "production" && a.demo))
        .filter((a) => matches(i.q, a.name, a.tagline, a.offer, ...a.services))
        .map((a) => ({
          kind: "zcard" as const,
          title: a.demo ? `${a.name} (sample)` : a.name,
          href: `/zcard/${a.slug}`,
          meta: a.tagline || "zcard page",
        })),
    );
  }
  return [...le, ...extra];
}

const cached = unstable_cache(run, ["site-search"], { revalidate: 300, tags: ["search", "ads"] });
export const parseSearch = (sp: Record<string, string | string[] | undefined>): SearchInput => {
  const g = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "").trim().slice(0, 100);
  return { q: g("q"), category: g("category"), city: g("city") };
};
export const searchSite = (i: SearchInput) => cached(i);
/** Exposed for tests/tools: search without cache or DB. */
export const searchFiles = (i: SearchInput) => (i.q ? [...fileListings(i), ...(i.category ? [] : fileEvents(i))] : []);

/** Anonymous search log: normalized query, result count and day. No IP or user data. */
export async function logSearch(q: string, results: number): Promise<void> {
  const sql = db();
  const query = norm(q).replace(/\s+/g, " ").trim().slice(0, 100);
  if (!sql || !query) return;
  try {
    await sql.query(
      `insert into search_log (day, query, results) values ((now() at time zone 'America/Toronto')::date, $1, $2)
       on conflict (day, query) do update set n = search_log.n + 1, results = excluded.results`,
      [query, results],
    );
  } catch (e) {
    console.warn("[search] log failed", (e as Error).message);
  }
}
