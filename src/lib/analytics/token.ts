import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed results links: /results/<id>?t=<token>, token = HMAC-SHA256(ANALYTICS_SECRET, "results:<id>").
 * No secret configured = results pages are switched off (404). Admin uses ADMIN_KEY the same way.
 */
const secret = () => process.env.ANALYTICS_SECRET ?? "";
export const resultsToken = (id: string) =>
  createHmac("sha256", secret()).update(`results:${id}`).digest("base64url").slice(0, 32);
const same = (a: string, b: string) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};
export const validResultsToken = (id: string, t: string | undefined | null) =>
  !!secret() && !!t && same(t, resultsToken(id));
export const validAdminKey = (k: string | undefined | null) =>
  !!process.env.ADMIN_KEY && !!k && same(k, process.env.ADMIN_KEY);
