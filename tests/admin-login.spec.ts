import { expect, test } from "@playwright/test";
import { TEST_ENV } from "../playwright.config";
import { login } from "./adminLogin";

const ADMIN = ["/admin", "/admin/listings", "/admin/ads/manage", "/admin/inquiries", "/admin/dashboard", "/admin/qr", "/admin/advertisers", "/admin/analytics", "/admin/ads"];

const toLogin = (p: string) => `/admin/login?next=${encodeURIComponent(p)}`;
const noFollow = { maxRedirects: 0 } as const;

test("signed-out admin pages send to sign-in (no admin data, no key in URL); ?key= and forged cookies still fail", async ({ request }) => {
  for (const p of ADMIN) {
    const r = await request.get(p, noFollow);
    expect(r.status(), p).toBe(307);
    expect(r.headers()["location"], p).toBe(toLogin(p));
    const k = await request.get(`${p}?key=${TEST_ENV.ADMIN_KEY}`, noFollow);
    expect(k.status(), p).toBe(307);
    expect(k.headers()["location"], p).not.toContain(TEST_ENV.ADMIN_KEY);
  }
  expect((await request.get(`/admin/analytics/summary?key=${TEST_ENV.ADMIN_KEY}`)).status()).toBe(404);
  const forged = await request.get("/admin", { ...noFollow, headers: { cookie: "pp_admin=9999999999.forged" } });
  expect(forged.headers()["location"]).toBe(toLogin("/admin"));
});

test("sign-in returns to the requested admin page; unsafe next values fall back to /admin", async ({ page }) => {
  await page.goto("/admin/qr");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin%2Fqr$/);
  await page.getByLabel("Admin key").fill(TEST_ENV.ADMIN_KEY);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page).toHaveURL(/\/admin\/qr$/);
  for (const bad of ["https://evil.example/admin", "//evil.example", "/\\evil.example", "/magazine"]) {
    await page.goto(`/admin/login?next=${encodeURIComponent(bad)}`);
    await expect(page).toHaveURL(/\/admin$/);
  }
});

test("login sets an HttpOnly Secure SameSite=Strict 8h cookie; no key in any link; logout ends it", async ({ page, context }) => {
  await page.goto("/admin/login");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.getByLabel("Admin key").fill("wrong");
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("login-msg")).toHaveText("That key did not work.");
  await login(page);
  const c = (await context.cookies()).find((x) => x.name === "pp_admin")!;
  expect(c.httpOnly).toBe(true);
  expect(c.secure).toBe(true);
  expect(c.sameSite).toBe("Strict");
  const left = c.expires - Date.now() / 1000;
  expect(left).toBeGreaterThan(8 * 3600 - 120);
  expect(left).toBeLessThan(8 * 3600 + 120);
  for (const p of ADMIN) {
    expect((await page.goto(p))?.status(), p).toBe(200);
    const html = await page.content();
    expect(html, p).not.toContain(TEST_ENV.ADMIN_KEY);
    expect(html, p).not.toMatch(/[?&]key=/);
    expect(page.url()).not.toContain("key=");
  }
  await page.goto("/admin");
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByTestId("login-msg")).toHaveText("Signed out.");
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login\?next=%2Fadmin$/);
});

test("login is lightly rate limited per IP", async ({ browser }) => {
  const ctx = await browser.newContext({ extraHTTPHeaders: { "x-forwarded-for": "10.99.0.1" } });
  const page = await ctx.newPage();
  for (let i = 0; i < 5; i++) {
    await page.goto("/admin/login");
    await page.getByLabel("Admin key").fill("wrong");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByTestId("login-msg")).toBeVisible();
  }
  await page.goto("/admin/login");
  await page.getByLabel("Admin key").fill(TEST_ENV.ADMIN_KEY);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByTestId("login-msg")).toHaveText(/Too many attempts/);
  await ctx.close();
});
