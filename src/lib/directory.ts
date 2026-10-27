import { publicCategories, publicListings, type PublicListing } from "@/lib/public";

/** Page size for /directory. Keeps HTML small as the catalogue grows. */
export const DIRECTORY_PAGE_SIZE = 48;

export type DirectoryFilters = {
  q: string;
  category: string;
  area: string;
  page: number;
};

/** Read filters from URL search params. Accepts category|sub and area|city for older links. */
export function parseDirectoryFilters(
  sp: Record<string, string | string[] | undefined> | URLSearchParams,
): DirectoryFilters {
  const get = (k: string) => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? "";
    const v = sp[k];
    return Array.isArray(v) ? (v[0] ?? "") : (v ?? "");
  };
  const rawPage = parseInt(get("page") || "1", 10);
  return {
    q: get("q").trim(),
    category: (get("category") || get("sub")).trim(),
    area: (get("area") || get("city")).trim(),
    page: Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1,
  };
}

export function filterPublicListings(f: Pick<DirectoryFilters, "q" | "category" | "area">): PublicListing[] {
  const q = f.q.toLowerCase();
  return publicListings.filter((l) => {
    if (f.category && l.category !== f.category) return false;
    if (f.area && l.area !== f.area) return false;
    if (!q) return true;
    const hay = `${l.name} ${l.address ?? ""} ${l.area}`.toLowerCase();
    return hay.includes(q);
  });
}

export function paginateListings<T>(items: T[], page: number, pageSize = DIRECTORY_PAGE_SIZE) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total,
    totalPages,
    page: safePage,
    pageSize,
    from: total === 0 ? 0 : start + 1,
    to: Math.min(start + pageSize, total),
  };
}

/** Build a /directory URL preserving active filters. Omits page=1. */
export function directoryHref(f: Partial<DirectoryFilters> & { page?: number }): string {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.category) p.set("category", f.category);
  if (f.area) p.set("area", f.area);
  if (f.page && f.page > 1) p.set("page", String(f.page));
  const qs = p.toString();
  return qs ? `/directory?${qs}` : "/directory";
}

export function directoryFilterOptions() {
  const categories = publicCategories
    .filter((c) => publicListings.some((l) => l.category === c.slug))
    .map((c) => ({ value: c.slug, label: c.name }));
  const areas = [...new Set(publicListings.map((l) => l.area))].sort((a, b) => a.localeCompare(b));
  return { categories, areas };
}
