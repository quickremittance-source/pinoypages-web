import { expect, test } from "@playwright/test";
import { statSync } from "node:fs";
import path from "node:path";

test("collage assets stay small", () => {
  const dir = path.join(process.cwd(), "public/brand/magazine");
  expect(statSync(path.join(dir, "collage.webp")).size).toBeLessThanOrEqual(150 * 1024);
  expect(statSync(path.join(dir, "collage.jpg")).size).toBeLessThanOrEqual(80 * 1024);
});

for (const route of ["/", "/magazine", "/calendar", "/directory/money-business", "/advertise", "/get-verified"]) {
  test(`magazine hero renders on ${route}`, async ({ page }) => {
    await page.goto(route);
    const hero = page.locator("[data-magazine-hero]");
    await expect(hero).toHaveCount(1);
    await expect(hero.locator("h1")).toBeVisible();
    await expect(hero.locator("img").first()).toHaveAttribute("alt", "");
    await expect(hero).toContainText("public-domain vintage postcards");
  });
}

test("magazine hero renders on an article page", async ({ page }) => {
  await page.goto("/magazine");
  const href = await page.locator("[data-story] a, a[href^='/magazine/']").first().getAttribute("href");
  await page.goto(href!);
  await expect(page.locator("[data-magazine-hero] h1")).toBeVisible();
});
