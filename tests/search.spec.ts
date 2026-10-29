import { test, expect } from "@playwright/test";
import data from "../content/public-listings.json";

test("header search box is on every page and submits to /search", async ({ page }) => {
  for (const p of ["/", "/directory", "/zcard"]) {
    await page.goto(p);
    await expect(page.locator('form[action="/search"]').first()).toBeAttached();
  }
  await page.goto("/search?q=tax");
  await expect(page.getByTestId("search-count")).toBeVisible();
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
});

test("search finds a directory business by name and respects filters", async ({ page }) => {
  const l = (data as { listings: { name: string; area: string }[] }).listings[0]!;
  await page.goto(`/search?q=${encodeURIComponent(l.name)}`);
  await expect(page.locator("[data-kind='listing']").first()).toContainText(l.name);
  await page.goto(`/search?q=${encodeURIComponent(l.name)}&city=${encodeURIComponent(l.area)}`);
  await expect(page.locator("[data-kind='listing']").first()).toBeVisible();
  await page.goto(`/search?q=${encodeURIComponent(l.name)}&city=NoSuchCity`);
  await expect(page.locator("[data-kind='listing']")).toHaveCount(0);
});

test("empty and junk queries are safe", async ({ page }) => {
  await page.goto("/search");
  await expect(page.getByText("Type a business name")).toBeVisible();
  const r = await page.goto(`/search?q=${encodeURIComponent("'; drop table listings; --")}`);
  expect(r?.status()).toBe(200);
});

test("sponsored click route never redirects off-site", async ({ request }) => {
  const r = await request.get("/api/sponsored/not-a-real-id", { maxRedirects: 0 });
  expect(r.status()).toBe(302);
  expect(r.headers()["location"]).toMatch(/\/search$/);
});
