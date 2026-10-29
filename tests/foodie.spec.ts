import { test, expect } from "@playwright/test";

test("filipinofoodie home and QR URL return 200, noindex", async ({ page }) => {
  const res = await page.goto("/filipinofoodie?utm_source=qr&utm_medium=print&utm_campaign=filipinofoodie");
  expect(res?.status()).toBe(200);
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.locator("h1")).toContainText("Filipino food in the GTA");
  await expect(page.locator("[data-slot=home-top]")).toContainText("Sponsored");
});

test("/food redirects to /filipinofoodie keeping the query", async ({ page }) => {
  await page.goto("/food?utm_source=qr");
  expect(new URL(page.url()).pathname).toBe("/filipinofoodie");
  expect(new URL(page.url()).searchParams.get("utm_source")).toBe("qr");
});

test("foodie subpages render and only $99 price is shown", async ({ page }) => {
  for (const p of [
    "restaurants",
    "gta/scarborough",
    "dish",
    "videos",
    "catering",
    "groceries",
    "delicacies",
    "promos",
    "legal",
    "b/sample",
  ]) {
    const res = await page.goto(`/filipinofoodie/${p}`);
    expect(res?.status(), p).toBe(200);
  }
  await page.goto("/filipinofoodie/claim");
  const prices = (await page.locator("main").innerText()).match(/\$\d+/g) ?? [];
  expect(prices.every((x) => x === "$99")).toBe(true);
});
