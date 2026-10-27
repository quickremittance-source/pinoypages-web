import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { hasDatabaseUrl, sql } from "./db";

/**
 * Moderated form submissions (community events, future jobs, and existing lead forms).
 * Adapters:
 *  - Postgres when DATABASE_URL is set (@neondatabase/serverless)
 *  - Local JSONL otherwise (data/submissions.jsonl); on Vercel without DATABASE_URL, logs only
 *
 * Production JSONL is not persistent on Vercel — known gap until a database is attached.
 */
export type SubmissionKind =
  | "community-event"
  | "job-submission"
  | "ad-inquiry"
  | "listing-claim"
  | "event-submission"
  | "newsletter-signup"
  | "free-listing"
  | (string & {});

export type SubmissionRecord = {
  kind: SubmissionKind;
  payload: Record<string, unknown>;
  submittedAt: string;
};

export interface SubmissionsStore {
  append(kind: SubmissionKind, payload: Record<string, unknown>): Promise<void>;
}

/** Append-only JSONL under data/. Skips file writes on Vercel (read-only FS). */
export class JsonlSubmissionsStore implements SubmissionsStore {
  constructor(private file = path.join(process.cwd(), "data", "submissions.jsonl")) {}
  async append(kind: SubmissionKind, payload: Record<string, unknown>) {
    const record: SubmissionRecord = { kind, payload, submittedAt: new Date().toISOString() };
    console.info(`[${kind}]`, JSON.stringify(record));
    if (process.env.VERCEL) return;
    try {
      await mkdir(path.dirname(this.file), { recursive: true });
      await appendFile(this.file, JSON.stringify(record) + "\n");
    } catch (err) {
      console.error("[submissions] could not write file", err);
    }
  }
}

/** Postgres submissions table (see migrations/001_storage.sql). */
export class PostgresSubmissionsStore implements SubmissionsStore {
  async append(kind: SubmissionKind, payload: Record<string, unknown>) {
    const submittedAt = new Date().toISOString();
    console.info(`[${kind}]`, JSON.stringify({ kind, payload, submittedAt }));
    // Neon serializes plain objects to jsonb; ISO string binds as timestamptz.
    await sql()`
      INSERT INTO submissions (kind, payload, submitted_at)
      VALUES (${kind}, ${payload as never}, ${submittedAt})
    `;
  }
}

const g = globalThis as unknown as { __ppSubmissions?: SubmissionsStore };

export function submissions(): SubmissionsStore {
  if (g.__ppSubmissions) return g.__ppSubmissions;
  g.__ppSubmissions = hasDatabaseUrl() ? new PostgresSubmissionsStore() : new JsonlSubmissionsStore();
  return g.__ppSubmissions;
}

/** Convenience: never throws to the form caller. */
export async function appendSubmission(kind: SubmissionKind, payload: Record<string, unknown>) {
  try {
    await submissions().append(kind, payload);
  } catch (e) {
    console.warn("[submissions] store failed", (e as Error).message);
  }
}
