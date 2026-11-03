/**
 * Dev-mode-only products (Jose, 3 Nov 2026): Filipino Foodie and Balikbayan Explorer
 * (to be renamed Balikbayan / Kabayan Traveller) must never be online in production.
 * Visible in local dev and Vercel Preview; 404 in Production unless ENABLE_DEV_FEATURES=true.
 */
export const DEV_ONLY_PREFIXES = [
  "/food",
  "/foodie",
  "/food-finder",
  "/filipino-foodie",
  "/travel",
  "/explorer",
  "/balikbayan",
  "/traveller",
  "/kabayan-traveller",
] as const;

export function devFeaturesEnabled(env: Record<string, string | undefined> = process.env): boolean {
  if (env.ENABLE_DEV_FEATURES === "true") return true;
  if (env.ENABLE_DEV_FEATURES === "false") return false;
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}

export function isDevOnlyPath(pathname: string): boolean {
  const p = pathname.toLowerCase();
  return DEV_ONLY_PREFIXES.some((pre) => p === pre || p.startsWith(pre + "/"));
}
