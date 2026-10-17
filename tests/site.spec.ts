import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import guide from "../content/guide.json";

const routes = [...new Set(guide.pages.map((p) => p.route))].concat([
  "/directory",
  "/destinations",
  "/upgrade",
  "/privacy",
  "/listing/tax-02",
]);

for (const path of [...new Set(routes)]) {
  test(`${path} renders and passes axe`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("every printed QR target (with UTM) resolves and canonical drops UTM", async ({ page }) => {
  for (const p of guide.pages.filter((x) => x.section !== "cover")) {
    const res = await page.goto(`${p.route}?utm_source=guide&utm_medium=qr&utm_campaign=x&utm_content=p${p.page}`);
    expect(res?.status(), `page ${p.page}`).toBe(200);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).not.toContain("utm_");
  }
});

test("all 11 ad slots from the shared data render on the site", async ({ page }) => {
  let count = 0;
  for (const r of ["/", "/deadlines", "/directory", "/destinations", "/advertise"]) {
    await page.goto(r);
    count += await page.locator('aside[aria-label^="Ad space"], aside[aria-label^="Advertisement"]').count();
  }
  expect(count).toBe(guide.ads.length);
});

test("HST checker verdicts", async ({ page }) => {
  await page.goto("/tools/hst");
  const q = page.getByLabel(/Quarter \d sales/);
  for (let i = 0; i < 4; i++) await q.nth(i).fill("5000");
  await expect(page.getByRole("status")).toContainText("small supplier");
  await q.nth(0).fill("12000");
  await q.nth(1).fill("12000");
  await expect(page.getByRole("status")).toContainText("must register by the end of the month");
  await q.nth(2).fill("31000");
  await expect(page.getByRole("status")).toContainText("One quarter is over $30,000");
});

test("CPP estimator caps at 2026 maximums", async ({ page }) => {
  await page.goto("/tools/cpp");
  const input = page.getByLabel(/net self-employment income/);
  await input.fill("50000");
  await expect(page.getByTestId("cpp-total")).toContainText("5,533.50");
  await input.fill("200000");
  await expect(page.getByTestId("cpp-total")).toContainText("9,292.90");
});

test("claim flow from a listing validates then succeeds", async ({ page }) => {
  await page.goto("/directory/tax-accounting");
  await page
    .getByRole("link", { name: /Claim or upgrade/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/upgrade\?listing=/);
  await expect(page.getByText("Claiming:")).toBeVisible();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Featured").check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("ad inquiry form validates then succeeds", async ({ page }) => {
  await page.goto("/advertise?slot=slot-03");
  await expect(page.getByRole("heading", { name: /space slot-03/ })).toBeVisible();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel(/interested in/).selectOption("full");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("status").first()).toContainText("We received your request");
});

test("security + noindex headers", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["x-frame-options"]).toBe("DENY");
});

test("unknown routes 404", async ({ page }) => {
  expect((await page.goto("/listing/nope"))?.status()).toBe(404);
  expect((await page.goto("/directory/nope"))?.status()).toBe(404);
});
