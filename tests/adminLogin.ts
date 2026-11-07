import type { APIRequestContext, Page } from "@playwright/test";
import { TEST_ENV } from "../playwright.config";

/** Sign in through /admin/login (sets the HttpOnly session cookie on this page's context). */
export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin key").fill(TEST_ENV.ADMIN_KEY);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
}

/** Signed-out admin request: pages redirect to sign-in (safe ?next=), file routes stay 404. Never 200. */
export async function expectAdminGate(request: APIRequestContext, path: string) {
  const r = await request.get(path, { maxRedirects: 0 });
  const loc = r.headers()["location"] ?? "";
  if (r.status() === 404) return;
  if (r.status() !== 307 || !loc.startsWith("/admin/login?next=%2Fadmin")) {
    throw new Error(`${path}: expected 404 or sign-in redirect, got ${r.status()} ${loc}`);
  }
  if (loc.includes("key")) throw new Error(`${path}: key leaked into redirect`);
}
