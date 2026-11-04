export const clean = (v: unknown) => (typeof v === "string" && v.trim() ? v.replace(/[\r\n]+/g, " ").trim().slice(0, 200) : undefined);
/** Pure: languages may be stored as a string or an array; anything else is ignored (never invented). */
export function parseLanguages(v: unknown): string | undefined {
  if (Array.isArray(v)) return clean(v.filter((x) => typeof x === "string" && x.trim()).join(", "));
  return clean(v);
}

