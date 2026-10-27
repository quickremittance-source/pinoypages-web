import data from "../../content/jobs.json";
import { publicListings } from "@/lib/public";

export type JobStatus = "approved" | "pending";

export type JobPost = {
  id: string;
  title: string;
  listingId: string;
  businessName: string;
  city: string;
  category: string;
  description: string;
  applyUrl?: string;
  applyEmail?: string;
  postedAt: string;
  status: JobStatus;
};

type FileShape = { schemaVersion?: number; jobs: JobPost[] };
const file = data as FileShape;

/** Public catalogue: approved only. Launches empty — no sample jobs. */
export function approvedJobs(): JobPost[] {
  return (file.jobs ?? []).filter((j) => j.status === "approved");
}

export function listingOptions() {
  return publicListings.map((l) => ({
    listing_id: l.listing_id,
    name: l.name,
    area: l.area,
    category: l.category,
  }));
}

export const JOB_CITIES = [
  "GTA",
  "Winnipeg",
  "Calgary",
  "Edmonton",
  "Vancouver",
  "Montreal",
  "Ottawa",
  "Other",
] as const;

export const JOB_COPY = {
  kicker: { en: "Jobs", tl: "Mga Trabaho" },
  title: { en: "Jobs from Pinoy Pages listings", tl: "Mga trabaho mula sa listahan ng Pinoy Pages" },
  intro: {
    en: "Open roles posted by businesses in the Pinoy Pages directory. Every submission is reviewed — nothing is auto-published.",
    tl: "Mga bukás na trabaho mula sa negosyo sa direktoryo ng Pinoy Pages. Sinusuri ang bawat submission — walang auto-publish.",
  },
  empty: {
    en: "No jobs published yet. Listed businesses can submit a role for review.",
    tl: "Wala pang nailathalang trabaho. Maaaring magsumite ang mga nakalistang negosyo para sa pagsusuri.",
  },
  submit: { en: "Submit a job", tl: "Magsumite ng trabaho" },
  city: { en: "City", tl: "Lungsod" },
  listing: { en: "Your Pinoy Pages listing", tl: "Inyong listahan sa Pinoy Pages" },
  jobTitle: { en: "Job title", tl: "Titulo ng trabaho" },
  description: { en: "Description", tl: "Paglalarawan" },
  applyUrl: { en: "Application link (optional)", tl: "Link sa aplikasyon (opsyonal)" },
  applyEmail: { en: "Application email (optional)", tl: "Email sa aplikasyon (opsyonal)" },
  contactName: { en: "Contact name", tl: "Pangalan ng kontak" },
  contactEmail: { en: "Contact email", tl: "Email ng kontak" },
  consent: {
    en: "I agree Pinoy Pages may email me about this job posting.",
    tl: "Sumasang-ayon ako na maaaring i-email ako ng Pinoy Pages tungkol sa post na ito.",
  },
} as const;

export function bi(c: { en: string; tl: string }) {
  return `${c.en} · ${c.tl}`;
}
