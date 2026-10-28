import "server-only";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/** Neon over HTTP. Only active when DATABASE_URL is set (Vercel Preview today); otherwise null and callers fall back. */
let client: NeonQueryFunction<false, false> | null | undefined;
export function db() {
  if (client === undefined) client = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : null;
  return client;
}
