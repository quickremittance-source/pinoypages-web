import { test, expect } from "@playwright/test";

test("private analytics pages 404 without key/token and stay noindex", async ({ request }) => {
  for (const p of ["/admin/advertisers", "/admin/advertisers?key=wrong", "/stats/" + "a".repeat(36), "/stats/nope"]) {
    const r = await request.get(p);
    expect(r.status(), p).toBe(404);
    expect(r.headers()["x-robots-tag"]).toContain("noindex");
  }
});

test("admin advertisers + analytics render with key (no DB = note)", async ({ page }) => {
  await page.goto("/admin/advertisers?key=test-admin-key");
  await expect(page.getByRole("heading", { name: "Advertisers" })).toBeVisible();
  await page.goto("/admin/analytics?key=test-admin-key&from=2026-10-01&to=2026-10-29");
  await expect(page.getByTestId("site-analytics")).toBeVisible();
});

test("page-view beacon validates input and never counts private paths", async ({ request }) => {
  expect((await request.post("/api/pv", { data: "x" })).status()).toBe(400);
  expect((await request.post("/api/pv", { data: { p: "/admin/ads" } })).status()).toBe(400);
  expect((await request.post("/api/pv", { data: { p: "https://evil" } })).status()).toBe(400);
  expect((await request.post("/api/pv", { data: { p: "/directory", r: "https://google.com/x" } })).status()).toBe(204);
});

test("footer shows 'Powered by zcard digital ads' on home and directory (plain text)", async ({ page }) => {
  for (const p of ["/", "/directory"]) {
    await page.goto(p);
    const f = page.getByTestId("zcard-footer");
    await expect(f).toHaveText("Powered by zcard digital ads");
    expect(await f.locator("a").count()).toBe(0);
  }
});

test("/zcard explains the concept with only the $99 public price", async ({ page }) => {
  await page.goto("/zcard");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("zcard");
  await expect(page.getByTestId("verified-price")).toHaveText("$99 per year + HST");
  const text = (await page.getByTestId("zcard-pricing").innerText()).replace("$99", "");
  expect(text).not.toMatch(/\$\d/);
  await expect(page.getByText("Scan to order yours").first()).toBeVisible();
  await expect(page.getByTestId("zcard-limited")).toContainText("Limited spaces available");
  expect(await page.locator('meta[name="robots"]').getAttribute("content")).toContain("noindex");
});
