import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { validAdminKey } from "@/lib/analytics/token";

/**
 * Admin session: /admin/login POSTs ADMIN_KEY once; we set an HttpOnly, Secure, SameSite=Strict cookie
 * "<expiry>.<HMAC(ADMIN_KEY, admin:<expiry>)>" valid 8h. Signed with ADMIN_KEY, so rotating the key logs everyone out.
 * The key itself never goes into a URL or a page. /api/revalidate and scripts keep the x-admin-key header.
 */
export const ADMIN_COOKIE = "pp_admin";
export const SESSION_SECONDS = 8 * 60 * 60;
const sig = (exp: string) =>
  createHmac("sha256", process.env.ADMIN_KEY ?? "").update(`admin:${exp}`).digest("base64url");

export const makeSession = (now = Date.now()) => {
  const exp = String(Math.floor(now / 1000) + SESSION_SECONDS);
  return `${exp}.${sig(exp)}`;
};

export const validSession = (v: string | undefined | null, now = Date.now()) => {
  if (!process.env.ADMIN_KEY || !v) return false;
  const [exp, s] = v.split(".");
  if (!exp || !s || !/^\d+$/.test(exp) || Number(exp) * 1000 <= now) return false;
  const a = Buffer.from(s);
  const b = Buffer.from(sig(exp));
  return a.length === b.length && timingSafeEqual(a, b);
};

/** For pages and server actions. */
export async function isAdmin() {
  return validSession((await cookies()).get(ADMIN_COOKIE)?.value);
}
export async function assertAdmin() {
  if (!(await isAdmin())) throw new Error("forbidden");
}
/** For route handlers. */
export const isAdminReq = (req: Request) => {
  const m = (req.headers.get("cookie") ?? "").match(new RegExp(`(?:^|;\\s*)${ADMIN_COOKIE}=([^;]+)`));
  return validSession(m?.[1]);
};

/** Light per-IP limit: 5 failed attempts per 10 minutes (per server instance). */
const fails = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
export const loginBlocked = (ip: string, now = Date.now()) =>
  (fails.get(ip) ?? []).filter((t) => now - t < WINDOW).length >= 5;
export const noteFail = (ip: string, now = Date.now()) => {
  const l = (fails.get(ip) ?? []).filter((t) => now - t < WINDOW);
  l.push(now);
  fails.set(ip, l);
  if (fails.size > 5000) fails.clear();
};
export const checkKey = validAdminKey;
