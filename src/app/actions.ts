"use server";

import { z } from "zod";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { ads, categories, listings } from "@/lib/guide";
import { saveContact, type ListKey } from "@/lib/contacts";

const urlOk = z.url("Enter a full link starting with https://").max(300);

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
  product: z.enum(["verified", "ad-2027"], { message: "Choose an option" }),
  slot: z.enum(slotIds).optional().or(z.literal("")),
  message: optional(z.string().trim().max(600)),
});

const claimSchema = z.object({
  ...contact,
  listing: z.enum(listingIds).optional().or(z.literal("")),
  plan: z.enum(["free", "verified"], { message: "Choose a plan" }),
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

/** Source tag for the contacts adapter: form name + utm_source passed through a hidden field. */
const src = (form: string, fd: FormData) => {
  const utm = String(fd.get("utm_source") ?? "")
    .replace(/[^\w-]/g, "")
    .slice(0, 40);
  return `form:${form}${utm ? `|utm:${utm}` : ""}`;
};

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
  await saveContact({
    email: r.data.email,
    name: r.data.name,
    business: r.data.business,
    phone: r.data.phone,
    lists: r.data.product === "verified" ? ["prospects", "verified-lead"] : ["prospects"],
    source: src("advertise", fd),
    attributes: { INTEREST: r.data.product },
  });
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
  const lists: ListKey[] = ["claimed", r.data.plan === "free" ? "free-lister" : "verified-lead"];
  if (r.data.plan !== "free") lists.push("prospects");
  await saveContact({
    email: r.data.email,
    name: r.data.name,
    business: r.data.business,
    phone: r.data.phone,
    lists,
    source: src("upgrade", fd),
    attributes: { LISTING: r.data.listing ?? "", PLAN: r.data.plan },
  });
  return { status: "success", message: "Thanks! We'll verify your listing and send your proof page." };
}

const eventSchema = z.object({
  eventName: z.string().trim().min(3, "Enter the event name").max(140),
  date: z.iso.date("Choose a date"),
  time: optional(z.string().trim().max(40)),
  place: z.string().trim().min(2, "Enter the place").max(140),
  organizer: z.string().trim().min(2, "Enter the organizer").max(120),
  email: z.email("Enter a valid email").max(200),
  phone: optional(z.string().trim().max(40)),
  plan: z.enum(["event-free", "event-featured"], { message: "Choose free or featured" }),
  category: z.enum(["tax", "money", "business", "insurance", "community"]).optional().or(z.literal("")),
  city: optional(z.string().trim().max(60)),
  memberListing: z.enum(listingIds).optional().or(z.literal("")),
  description: optional(z.string().trim().max(600)),
  link: urlOk.optional().or(z.literal("")),
  consent: z.literal("on", { message: "Please agree so we can contact you" }),
});

/** Event submissions for the Money & Business Calendar (stored locally; reviewed before publishing). */
export async function submitEvent(_p: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website_url") ?? "")) return { status: "success", message: "Thanks!" };
  const r = parse(eventSchema, fd);
  if (!r.success)
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(r.error).fieldErrors,
    };
  const member = listings.find((l) => l.id === r.data.memberListing && l.tier !== "free");
  await store("event-submission", { ...r.data, memberFree: r.data.plan === "event-featured" && !!member });
  await saveContact({
    email: r.data.email,
    name: r.data.organizer,
    phone: r.data.phone,
    lists: ["event-organizers", "event-submitter"],
    source: src("event", fd),
    attributes: { EVENT_PLAN: r.data.plan, EVENT_CITY: r.data.city ?? "" },
  });
  return {
    status: "success",
    message:
      r.data.plan === "event-featured"
        ? member
          ? "Thanks! As a member your featured event is free. We'll review it and confirm by email."
          : "Thanks! We'll review your event and confirm the $49 featured upgrade with you by email before anything is charged."
        : "Thanks! We'll review your free event listing and confirm by email.",
  };
}

const signupSchema = z.object({
  name: optional(z.string().trim().max(120)),
  email: z.email("Enter a valid email").max(200),
  consent: z.literal("on", { message: "Please agree so we can email you" }),
});

/** Monthly member email sign-up (newsletter list). Explicit consent required (CASL). */
export async function submitSignup(_p: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website_url") ?? "")) return { status: "success", message: "Thanks!" };
  const r = parse(signupSchema, fd);
  if (!r.success)
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(r.error).fieldErrors,
    };
  await store("newsletter-signup", r.data);
  await saveContact({ email: r.data.email, name: r.data.name, lists: ["newsletter"], source: src("signup", fd) });
  return { status: "success", message: "Salamat! You're on the list for the monthly member email." };
}

const subIds = categories.map((c) => c.slug) as [string, ...string[]];
const listFreeSchema = z.object({
  ...contact,
  sub: z.enum(subIds, { message: "Choose a sub-category" }),
  city: z.string().trim().min(2, "Enter your city").max(60),
  languages: optional(z.string().trim().max(120)),
  wantsVerified: z.literal("on").optional(),
});

/** /list-free: a free, unverified listing (name + contact). Optional "tell me about Verified" adds the verified-lead tag. */
export async function submitListFree(_p: FormState, fd: FormData): Promise<FormState> {
  if (String(fd.get("website_url") ?? "")) return { status: "success", message: "Thanks!" };
  const r = parse(listFreeSchema, fd);
  if (!r.success)
    return {
      status: "error",
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(r.error).fieldErrors,
    };
  await store("free-listing", r.data);
  const lists: ListKey[] = ["free-lister"];
  if (r.data.wantsVerified === "on") lists.push("verified-lead");
  await saveContact({
    email: r.data.email,
    name: r.data.name,
    business: r.data.business,
    phone: r.data.phone,
    lists,
    source: src("list-free", fd),
    attributes: { SUBCATEGORY: r.data.sub, CITY: r.data.city },
  });
  return {
    status: "success",
    message:
      r.data.wantsVerified === "on"
        ? "Thanks! We'll confirm your free listing by email, and send you the details on Verified."
        : "Thanks! We'll confirm your free listing by email before it appears.",
  };
}
