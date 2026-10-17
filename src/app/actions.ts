"use server";

import { z } from "zod";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ads, listings } from "@/lib/guide";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string[] | undefined> };

const slotIds = ads.map((a) => a.id) as [string, ...string[]];
const listingIds = listings.map((l) => l.id) as [string, ...string[]];
const optional = (s: z.ZodString) => s.optional().or(z.literal(""));

const contact = {
  name: z.string().trim().min(2, "Enter your name").max(120),
  business: z.string().trim().min(2, "Enter your business name").max(120),
  email: z.email("Enter a valid email").max(200),
  phone: optional(z.string().trim().max(40)),
  consent: z.literal("on", { message: "Please agree so we can contact you" }),
};

const inquirySchema = z.object({
  ...contact,
  product: z.enum(["featured", "half", "full"], { message: "Choose an option" }),
  slot: z.enum(slotIds).optional().or(z.literal("")),
  message: optional(z.string().trim().max(600)),
});

const claimSchema = z.object({
  ...contact,
  listing: z.enum(listingIds).optional().or(z.literal("")),
  plan: z.enum(["free", "featured", "half", "full"], { message: "Choose a plan" }),
  corrections: optional(z.string().trim().max(600)),
});

/**
 * No emails are sent. Submissions are logged and, outside Vercel, appended to a local JSONL file (data/ is git-ignored).
 * On Vercel the filesystem is read-only, so they appear in the function logs only until a real store is chosen.
 */
async function store(kind: string, data: Record<string, unknown>) {
  const record = { kind, ...data, submittedAt: new Date().toISOString() };
  console.info(`[${kind}]`, JSON.stringify(record));
  if (process.env.VERCEL) return;
  try {
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "submissions.jsonl"), JSON.stringify(record) + "\n");
  } catch (err) {
    console.error("[store] could not write file", err);
  }
}

function parse<T extends z.ZodTypeAny>(schema: T, fd: FormData) {
  return schema.safeParse(Object.fromEntries(fd));
}

export async function submitInquiry(_p: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website_url") ?? "")) return { status: "success", message: "Thanks!" };
  const r = parse(inquirySchema, fd);
  if (!r.success)
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(r.error).fieldErrors,
    };
  await store("ad-inquiry", r.data);
  return {
    status: "success",
    message: "Thanks! We received your request and will contact you within 2 business days.",
  };
}

export async function submitClaim(_p: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website_url") ?? "")) return { status: "success", message: "Thanks!" };
  const r = parse(claimSchema, fd);
  if (!r.success)
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(r.error).fieldErrors,
    };
  await store("listing-claim", r.data);
  return { status: "success", message: "Thanks! We'll verify your listing and send your proof page." };
}
