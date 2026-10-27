import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { massEvents, isSimbangGabi } from "../src/lib/mass";

test("mass finder lists church events from events.json with sources", async ({ page }) => {
  const all = massEvents();
  expect(all.length).toBeGreaterThan(0);
  for (const e of all) {
    expect(e.category).toBe("church");
    expect(e.sourceUrl).toBeTruthy();
  }
  const res = await page.goto("/tools/mass-finder");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Filipino Mass/i);
  await expect(page.getByTestId("mass-event")).toHaveCount(all.length);
  await expect(page.getByTestId("mass-source").first()).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("mass finder simbang filter", async ({ page }) => {
  const simbang = massEvents().filter(isSimbangGabi);
  await page.goto("/tools/mass-finder?simbang=1");
  await expect(page.getByTestId("mass-count")).toContainText(String(simbang.length));
  if (simbang.length) {
    await expect(page.getByTestId("mass-event")).toHaveCount(simbang.length);
  }
});
