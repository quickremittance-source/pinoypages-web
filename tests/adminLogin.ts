import type { Page } from "@playwright/test";
import { TEST_ENV } from "../playwright.config";

/** Sign in through /admin/login (sets the HttpOnly session cookie on this page's context). */
export async function login(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Admin key").fill(TEST_ENV.ADMIN_KEY);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/admin$/);
}
