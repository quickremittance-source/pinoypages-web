import { expect, test } from "@playwright/test";

test("category pages embed the matching free tools", async ({ page, request }) => {
  await page.goto("/directory/money-business");
  await expect(page.locator('[data-tool="peso-converter"]')).toBeVisible();
  await expect(page.locator('[data-tool="remittance-compare"]')).toBeVisible();
  await expect(page.locator('[data-tool="balikbayan-box"]')).toHaveCount(0);
  await page.goto("/directory/insurance-financial");
  await expect(page.locator('[data-tool="remittance-compare"]')).toBeVisible();
  await page.goto("/directory/travel-padala-remit");
  await expect(page.locator('[data-tool="balikbayan-box"]')).toBeVisible();
  await expect(page.locator('[data-tool="peso-converter"]')).toBeVisible();
  await page.goto("/directory/tax-accounting");
  await expect(page.getByTestId("category-tools")).toHaveCount(0);
  expect((await request.get("/tools/hst-checker", { maxRedirects: 0 })).status()).toBe(308);
});
