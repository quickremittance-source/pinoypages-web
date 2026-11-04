/** Pure parsing/validation for the internal admin editor (no DB, unit-tested). */
export const LISTING_STATUSES = ["published", "hidden"] as const;
export const LISTING_TIERS = ["free", "verified"] as const;
export const AD_TIERS = ["full", "half", "quarter", "zcard"] as const;
export const AD_STATUSES = ["draft", "live", "ended"] as const;

export type ListingPatch = {
  name: string;
  category: string | null;
  area: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  website: string | null;
  tier: (typeof LISTING_TIERS)[number];
  verified: boolean;
  verified_until: string | null;
  status: (typeof LISTING_STATUSES)[number];
  locked: boolean;
};
export type AdPatch = {
  listing_id: string | null;
  tier: (typeof AD_TIERS)[number];
  status: (typeof AD_STATUSES)[number];
  start_date: string | null;
  end_date: string | null;
  name: string;
};

type Get = { get(k: string): FormDataEntryValue | null };
const str = (fd: Get, k: string, max = 200) => {
  const v = String(fd.get(k) ?? "")
    .trim()
    .slice(0, max);
  return v || null;
};
const date = (fd: Get, k: string) => {
  const v = str(fd, k, 10);
  if (v && !/^\d{4}-\d{2}-\d{2}$/.test(v)) throw new Error(`${k} must be YYYY-MM-DD`);
  return v;
};
const oneOf = <T extends readonly string[]>(list: T, v: string | null, k: string): T[number] => {
  if (!v || !list.includes(v)) throw new Error(`${k} must be one of ${list.join(", ")}`);
  return v as T[number];
};
const url = (v: string | null) => {
  if (!v) return null;
  if (!/^https?:\/\/[^\s]+$/i.test(v)) throw new Error("website must start with http:// or https://");
  return v;
};

export function parseListingForm(fd: Get): ListingPatch {
  const name = str(fd, "name");
  if (!name) throw new Error("name is required");
  const email = str(fd, "email");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("email looks invalid");
  const verified = fd.get("verified") === "on";
  const verified_until = date(fd, "verified_until");
  if (verified && !verified_until) throw new Error("verified needs a verified_until date");
  return {
    name,
    category: str(fd, "category", 60),
    area: str(fd, "area", 60),
    phone: str(fd, "phone", 40),
    email,
    address: str(fd, "address"),
    website: url(str(fd, "website")),
    tier: oneOf(LISTING_TIERS, str(fd, "tier"), "tier"),
    verified,
    verified_until,
    status: oneOf(LISTING_STATUSES, str(fd, "status"), "status"),
    // Any manual edit locks the row so a future Brevo sync cannot overwrite it (untick to release).
    locked: fd.get("locked") === "on",
  };
}

export function parseAdForm(fd: Get): AdPatch {
  const name = str(fd, "name");
  if (!name) throw new Error("name is required");
  const start_date = date(fd, "start_date");
  const end_date = date(fd, "end_date");
  if (start_date && end_date && end_date < start_date) throw new Error("end_date is before start_date");
  return {
    name,
    listing_id: str(fd, "listing_id", 80),
    tier: oneOf(AD_TIERS, str(fd, "tier"), "tier"),
    status: oneOf(AD_STATUSES, str(fd, "status"), "status"),
    start_date,
    end_date,
  };
}

/** Changed keys only (for the audit message). */
export const changedKeys = (before: Record<string, unknown>, after: Record<string, unknown>) =>
  Object.keys(after).filter((k) => JSON.stringify(before[k] ?? null) !== JSON.stringify(after[k] ?? null));

export const SORT_COLS = ["name", "views", "clicks", "contacts", "scans"] as const;
export type SortCol = (typeof SORT_COLS)[number];
export type MetricRow = {
  kind: "listing" | "ad";
  ref: string;
  name: string;
  status: string;
  views: number;
  clicks: number;
  contacts: number;
  scans: number;
  codes: { code: string; n: number }[];
};
export function sortRows(rows: MetricRow[], col: string | undefined, dir: string | undefined) {
  const c: SortCol = (SORT_COLS as readonly string[]).includes(col ?? "") ? (col as SortCol) : "views";
  const d = dir === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const x = a[c];
    const y = b[c];
    const r = typeof x === "string" ? x.localeCompare(String(y)) : Number(x) - Number(y);
    return r * d || a.name.localeCompare(b.name);
  });
}
