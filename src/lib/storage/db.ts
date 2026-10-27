import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** True when a Postgres URL is configured. Never provisions or mutates env. */
export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

type Sql = NeonQueryFunction<false, false>;

const g = globalThis as unknown as { __ppSql?: Sql };

/** Lazy Neon SQL tagged-template client. Throws if DATABASE_URL is missing. */
export function sql(): Sql {
  if (g.__ppSql) return g.__ppSql;
  const url = process.env.DATABASE_URL?.trim();
  if (!url) throw new Error("DATABASE_URL is not set");
  g.__ppSql = neon(url);
  return g.__ppSql;
}
