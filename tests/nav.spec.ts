import { expect, test } from "@playwright/test";

test("menu hides Free tools and highlights the current page (exact and nested)", async ({ page, isMobile }) => {
  const nav = () => page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
  await page.goto("/directory");
  await expect(nav().getByRole("link", { name: /tools/i })).toHaveCount(0);
  await expect(nav().locator('[aria-current="page"]')).toHaveText("Directory");
  await page.goto("/magazine");
  await expect(nav().locator('[aria-current="page"]')).toHaveText("Magazine");
  await page.goto("/");
  await expect(nav().locator('[aria-current="page"]')).toHaveCount(0);
  expect((await page.request.get("/tools/hst-checker")).status()).toBe(200);
});

test("deadlines merged into the calendar: labels, type filter, redirect", async ({ page, request }) => {
  const r = await request.get("/tax-deadlines", { maxRedirects: 0 });
  expect(r.status()).toBe(308);
  expect(r.headers().location).toContain("/calendar?type=deadline");
  await page.goto("/calendar");
  await expect(page.getByTestId("type-label").filter({ hasText: "Tax deadline" }).first()).toBeVisible();
  await expect(page.locator("#tax-checklist")).toBeVisible();
  await page.goto("/calendar?type=deadline");
  await expect(page.getByTestId("type-filter")).toHaveValue("deadline");
  const shown = page.locator('[data-list] [data-ev]:not([hidden])');
  expect(await shown.count()).toBeGreaterThan(0);
  for (const t of await shown.evaluateAll((els) => els.map((e) => e.getAttribute("data-type")))) expect(t).toBe("deadline");
});
