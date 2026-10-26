import { test, expect } from "@playwright/test";
test("beta: visible Beta label and noindex", async ({ page }) => {
  const res = await page.goto("/");
  expect(res?.headers()["x-robots-tag"]).toContain("noindex");
  await expect(page.getByTestId("beta-banner")).toContainText("Beta");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page).toHaveTitle(/Beta/);
});
