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

test("Directory is the first menu item; Advertise & Get Verified is one item active on both pages", async ({ page, isMobile }) => {
  for (const path of ["/advertise", "/get-verified"]) {
    await page.goto(path);
    const main = page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
    await expect(main.getByRole("link").first()).toHaveText("Directory");
    const item = main.getByRole("link", { name: "Advertise & Get Verified" });
    await expect(item).toHaveAttribute("href", "/advertise");
    await expect(item).toHaveAttribute("aria-current", "page");
    await expect(main.getByRole("link", { name: "Get Verified", exact: true })).toHaveCount(0);
    const tabs = page.getByTestId("adv-tabs");
    await expect(tabs.getByRole("link", { name: "Get Verified" })).toHaveAttribute("href", "/get-verified");
    await expect(tabs.locator('[aria-current="page"]')).toHaveAttribute("href", path);
  }
});

test("directory shows category counts broken down by area", async ({ page }) => {
  await page.goto("/directory");
  const box = page.getByTestId("cat-area-counts");
  const food = box.locator('[data-cat="food"]');
  await expect(food).toContainText(/Food.*\(\d+\)/);
  await expect(food.locator("[data-cat-area]").first()).toHaveAttribute("href", /category=food&area=/);
  await expect(box.locator("[data-area]").first()).toHaveAttribute("href", /area=/);
});

test("/api/revalidate: 404 without a valid key header, GET is 404", async ({ request }) => {
  expect((await request.post("/api/revalidate")).status()).toBe(404);
  expect((await request.post("/api/revalidate", { headers: { "x-admin-key": "wrong" } })).status()).toBe(404);
  expect((await request.get("/api/revalidate")).status()).toBe(404);
});
