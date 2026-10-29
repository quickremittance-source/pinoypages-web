import "server-only";
import { cache } from "react";
import { neon } from "@neondatabase/serverless";
import { AREAS, areaOf } from "./areas";

/**
 * Filipino Foodie data. Read from Neon (FF_DATABASE_URL) at build/ISR time only; the browser never connects.
 * Without FF_DATABASE_URL (local tests, CI) every reader returns an empty set and pages show empty states.
 */
const sql = () => (process.env.FF_DATABASE_URL ? neon(process.env.FF_DATABASE_URL) : null);

export type Score = [number, string];
export type Evaluation = {
  scores: Record<string, Score>;
  summary: string | null;
  love: string | null;
  complaints: string | null;
  dishes: string | null;
  label: string;
  evaluatedAt: string;
  thirdParty: { source: string; value: string; count?: number; checked_at?: string }[];
};
export type MenuItem = { name: string; price: number; confirmedAt: string };
export type Restaurant = {
  slug: string;
  name: string;
  address: string | null;
  city: string | null;
  neighbourhood: string | null;
  area: string | null;
  phone: string | null;
  website: string | null;
  status: string;
  signatureDishes: string | null;
  dishSlugs: string[];
  overall: number | null;
};
export type Dish = { slug: string; name: string; description: string | null };
export type Video = {
  youtubeId: string;
  title: string;
  channel: string | null;
  thumbnail: string | null;
  dish: string | null;
  dishSlug: string | null;
  aiReview: string | null;
  aiLabel: string | null;
  scores: Record<string, number | Score> | null;
  restaurantSlugs: string[];
};

async function safe<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[foodie] data read failed:", (e as Error).message);
    return fallback;
  }
}

export const getRestaurants = cache(async (): Promise<Restaurant[]> => {
  const q = sql();
  if (!q) return [];
  return safe(async () => {
    const rows = (await q`
      select r.slug, r.name, r.address, r.city, r.neighbourhood, r.phone, r.website, r.status, r.signature_dishes,
        (e.scores->'overall'->>0)::float as overall,
        coalesce(array_agg(d.slug) filter (where d.slug is not null), '{}') as dish_slugs
      from restaurants r
      left join restaurant_evaluations e on e.restaurant_id = r.id
      left join restaurant_dishes rd on rd.restaurant_id = r.id
      left join dishes d on d.id = rd.dish_id
      where r.status not ilike 'closed%'
      group by r.id, e.scores
      order by overall desc nulls last, r.name`) as Record<string, unknown>[];
    return rows.map((r) => ({
      slug: String(r.slug),
      name: String(r.name),
      address: (r.address as string) ?? null,
      city: (r.city as string) ?? null,
      neighbourhood: (r.neighbourhood as string) ?? null,
      area: areaOf(r.city as string, r.neighbourhood as string),
      phone: (r.phone as string) ?? null,
      website: (r.website as string) ?? null,
      status: String(r.status),
      signatureDishes: (r.signature_dishes as string) ?? null,
      dishSlugs: (r.dish_slugs as string[]) ?? [],
      overall: r.overall == null ? null : Number(r.overall),
    }));
  }, []);
});

export const getRestaurant = async (slug: string) => (await getRestaurants()).find((r) => r.slug === slug) ?? null;

export const getEvaluation = cache(async (slug: string): Promise<Evaluation | null> => {
  const q = sql();
  if (!q) return null;
  return safe(async () => {
    const rows = (await q`
      select e.scores, e.summary, e.profile, e.label, e.evaluated_at, e.third_party_ratings
      from restaurant_evaluations e join restaurants r on r.id = e.restaurant_id where r.slug = ${slug}
      order by e.evaluated_at desc limit 1`) as Record<string, unknown>[];
    const r = rows[0];
    if (!r) return null;
    const p = (r.profile as Record<string, string>) ?? {};
    return {
      scores: (r.scores as Record<string, Score>) ?? {},
      summary: (r.summary as string) ?? null,
      love: p.love ?? null,
      complaints: p.complaints ?? null,
      dishes: p.dishes ?? null,
      label: "AI",
      evaluatedAt: new Date(r.evaluated_at as string).toISOString().slice(0, 10),
      thirdParty: Array.isArray(r.third_party_ratings) ? (r.third_party_ratings as Evaluation["thirdParty"]) : [],
    };
  }, null);
});

/** Owner-confirmed menu prices only. Unconfirmed prices are never returned. */
export const getMenu = cache(async (slug: string): Promise<MenuItem[]> => {
  const q = sql();
  if (!q) return [];
  return safe(async () => {
    const rows = (await q`
      select m.name, m.price_cad, m.confirmed_at from menu_items m join restaurants r on r.id = m.restaurant_id
      where r.slug = ${slug} and m.owner_confirmed and m.confirmed_at is not null and m.price_cad is not null
      order by m.name`) as Record<string, unknown>[];
    return rows.map((m) => ({
      name: String(m.name),
      price: Number(m.price_cad),
      confirmedAt: new Date(m.confirmed_at as string).toISOString().slice(0, 10),
    }));
  }, []);
});

export const getDishes = cache(async (): Promise<Dish[]> => {
  const q = sql();
  if (!q) return [];
  return safe(async () => (await q`select slug, name, description from dishes order by name`) as Dish[], []);
});

/** Only published, embeddable videos are shown. */
export const getVideos = cache(async (): Promise<Video[]> => {
  const q = sql();
  if (!q) return [];
  return safe(async () => {
    const rows = (await q`
      select v.youtube_id, v.title, v.channel, v.thumbnail_url, v.dish, d.slug as dish_slug, v.ai_review, v.ai_review_label,
        v.eval_scores, coalesce((select array_agg(r.slug) from restaurants r where r.id = any(v.restaurant_ids)), '{}') as rs
      from videos v left join dishes d on d.id = v.dish_id
      where v.published and coalesce(v.embeddable, false)
      order by v.published_at desc nulls last`) as Record<string, unknown>[];
    return rows.map((v) => ({
      youtubeId: String(v.youtube_id),
      title: String(v.title ?? ""),
      channel: (v.channel as string) ?? null,
      thumbnail: (v.thumbnail_url as string) ?? `https://i.ytimg.com/vi/${v.youtube_id}/hqdefault.jpg`,
      dish: (v.dish as string) ?? null,
      dishSlug: (v.dish_slug as string) ?? null,
      aiReview: (v.ai_review as string) ?? null,
      aiLabel: (v.ai_review_label as string) ?? null,
      scores: (v.eval_scores as Video["scores"]) ?? null,
      restaurantSlugs: (v.rs as string[]) ?? [],
    }));
  }, []);
});

export async function areaCounts() {
  const rs = await getRestaurants();
  return AREAS.map((a) => ({ ...a, count: rs.filter((r) => r.area === a.slug).length }));
}
