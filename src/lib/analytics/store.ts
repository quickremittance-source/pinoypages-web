import "server-only";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EventName, ListingStats } from "./events";

/**
 * Pluggable store. Pick with ANALYTICS_STORE:
 *  - "json"    local JSON file (default when not on Vercel): data/analytics.json
 *  - "memory"  in-process only (lost on restart)
 *  - "upstash" Upstash Redis REST (needs UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN) — not provisioned
 *  - "neon"    Postgres via @neondatabase/serverless (also selected automatically when DATABASE_URL is set)
 * On Vercel with nothing configured we fall back to "memory" + console logs (the filesystem is read-only).
 * Shared schema: migrations/001_storage.sql. No database is provisioned by this repo.
 */
export interface AnalyticsStore {
  increment(listingId: string, event: EventName, month: string, by?: number): Promise<void>;
  get(listingId: string): Promise<ListingStats>;
  all(): Promise<Record<string, ListingStats>>;
}

type Data = { v: 1; listings: Record<string, ListingStats> };

export class MemoryStore implements AnalyticsStore {
  protected data: Data = { v: 1, listings: {} };
  async increment(id: string, e: EventName, month: string, by = 1) {
    const m = ((this.data.listings[id] ??= {})[month] ??= {});
    m[e] = (m[e] ?? 0) + by;
  }
  async get(id: string) {
    return structuredClone(this.data.listings[id] ?? {});
  }
  async all() {
    return structuredClone(this.data.listings);
  }
}

/** Local JSON file. Writes are serialised in-process and written atomically (tmp + rename). */
export class JsonFileStore extends MemoryStore {
  private queue: Promise<unknown> = Promise.resolve();
  private loaded = false;
  constructor(private file = process.env.ANALYTICS_FILE ?? path.join(process.cwd(), "data", "analytics.json")) {
    super();
  }
  private async load() {
    try {
      this.data = JSON.parse(await readFile(this.file, "utf8")) as Data;
    } catch {
      this.data = { v: 1, listings: {} };
    }
    this.loaded = true;
  }
  private run<T>(fn: () => Promise<T>): Promise<T> {
    const p = this.queue.then(fn, fn);
    this.queue = p.catch(() => undefined);
    return p;
  }
  override increment(id: string, e: EventName, month: string, by = 1) {
    return this.run(async () => {
      await this.load();
      await super.increment(id, e, month, by);
      await mkdir(path.dirname(this.file), { recursive: true });
      const tmp = `${this.file}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(this.data));
      await rename(tmp, this.file);
    });
  }
  override get(id: string) {
    return this.run(async () => {
      if (!this.loaded) await this.load();
      return super.get(id);
    });
  }
  override all() {
    return this.run(async () => {
      if (!this.loaded) await this.load();
      return super.all();
    });
  }
}

/** Upstash Redis over REST: one hash per listing, field "<month>:<event>". Not provisioned. */
export class UpstashStore implements AnalyticsStore {
  constructor(
    private url = process.env.UPSTASH_REDIS_REST_URL!,
    private token = process.env.UPSTASH_REDIS_REST_TOKEN!,
  ) {}
  private async cmd(...args: (string | number)[]) {
    const r = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}` },
      body: JSON.stringify(args),
      cache: "no-store",
    });
    return ((await r.json()) as { result: unknown }).result;
  }
  async increment(id: string, e: EventName, month: string, by = 1) {
    await this.cmd("HINCRBY", `pp:stats:${id}`, `${month}:${e}`, by);
    await this.cmd("SADD", "pp:stats:ids", id);
  }
  async get(id: string) {
    const flat = ((await this.cmd("HGETALL", `pp:stats:${id}`)) as string[]) ?? [];
    const out: ListingStats = {};
    for (let i = 0; i < flat.length; i += 2) {
      const [month = "", e = ""] = (flat[i] ?? "").split(":");
      (out[month] ??= {})[e as EventName] = Number(flat[i + 1]);
    }
    return out;
  }
  async all() {
    const ids = ((await this.cmd("SMEMBERS", "pp:stats:ids")) as string[]) ?? [];
    return Object.fromEntries(await Promise.all(ids.map(async (id) => [id, await this.get(id)] as const)));
  }
}

/**
 * Postgres analytics via @neondatabase/serverless when DATABASE_URL is set.
 * Schema: migrations/001_storage.sql (listing_stats).
 */
export class NeonStore implements AnalyticsStore {
  async increment(id: string, e: EventName, month: string, by = 1) {
    const { sql } = await import("@/lib/storage/db");
    await sql()`
      INSERT INTO listing_stats (listing_id, month, event, n)
      VALUES (${id}, ${month}, ${e}, ${by})
      ON CONFLICT (listing_id, month, event)
      DO UPDATE SET n = listing_stats.n + EXCLUDED.n
    `;
  }
  async get(id: string) {
    const { sql } = await import("@/lib/storage/db");
    const rows = (await sql()`
      SELECT month, event, n FROM listing_stats WHERE listing_id = ${id}
    `) as { month: string; event: string; n: number }[];
    const out: ListingStats = {};
    for (const r of rows) (out[r.month] ??= {})[r.event as EventName] = Number(r.n);
    return out;
  }
  async all() {
    const { sql } = await import("@/lib/storage/db");
    const rows = (await sql()`
      SELECT listing_id, month, event, n FROM listing_stats
    `) as { listing_id: string; month: string; event: string; n: number }[];
    const out: Record<string, ListingStats> = {};
    for (const r of rows) {
      ((out[r.listing_id] ??= {})[r.month] ??= {})[r.event as EventName] = Number(r.n);
    }
    return out;
  }
}

const g = globalThis as unknown as { __ppStore?: AnalyticsStore };
export function store(): AnalyticsStore {
  if (g.__ppStore) return g.__ppStore;
  // DATABASE_URL wins: shared Postgres for counters (and submissions elsewhere).
  if (process.env.DATABASE_URL?.trim()) {
    g.__ppStore = new NeonStore();
    return g.__ppStore;
  }
  const kind = process.env.ANALYTICS_STORE ?? (process.env.VERCEL ? "memory" : "json");
  g.__ppStore =
    kind === "upstash"
      ? new UpstashStore()
      : kind === "neon"
        ? new NeonStore()
        : kind === "memory"
          ? new MemoryStore()
          : new JsonFileStore();
  return g.__ppStore;
}
