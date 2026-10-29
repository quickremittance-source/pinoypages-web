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
