/** GA4 helpers. Everything is a no-op unless NEXT_PUBLIC_GA_ID is set at build time. */
export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

type Params = Record<string, string | number | undefined>;
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const CTX_KEY = "pp_ad_ctx";
/** Ad/campaign context carried through the session so downstream clicks and QR scans tie back to a campaign. */
export type AdCtx = { ad_id?: string; campaign?: string; utm_source?: string; utm_medium?: string; placement?: string };

export function getAdCtx(): AdCtx {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(CTX_KEY) ?? "{}") as AdCtx;
  } catch {
    return {};
  }
}
export function setAdCtx(ctx: AdCtx) {
  try {
    sessionStorage.setItem(CTX_KEY, JSON.stringify({ ...getAdCtx(), ...ctx }));
  } catch {
    /* storage blocked */
  }
}
/** Read utm_* / ad params from the landing URL into the session context. */
export function captureUrlCtx() {
  if (typeof window === "undefined") return;
  const q = new URLSearchParams(window.location.search);
  const ctx: AdCtx = {};
  if (q.get("utm_campaign")) ctx.campaign = q.get("utm_campaign")!;
  if (q.get("utm_source")) ctx.utm_source = q.get("utm_source")!;
  if (q.get("utm_medium")) ctx.utm_medium = q.get("utm_medium")!;
  if (q.get("ad_id")) ctx.ad_id = q.get("ad_id")!;
  if (Object.keys(ctx).length) setAdCtx(ctx);
}

export function track(name: string, params: Params = {}) {
  if (typeof window === "undefined") return;
  const ctx = getAdCtx();
  const payload: Params = {
    ...params,
    ad_id: params.ad_id ?? ctx.ad_id,
    campaign: params.campaign ?? ctx.campaign,
    ctx_source: ctx.utm_source,
    ctx_medium: ctx.utm_medium,
  };
  // Test/debug hook: lets Playwright assert events without a GA ID.
  (window as unknown as { __ppEvents?: unknown[] }).__ppEvents?.push({ name, ...payload });
  if (GA_ID && window.gtag) window.gtag("event", name, payload);
}
