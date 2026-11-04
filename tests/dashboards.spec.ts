import { expect, test } from "@playwright/test";
import { qrTarget, rangeDays, daysIn, windowOf } from "../src/lib/dashRange";

test("rangeDays only allows 7/30/90", () => {
  expect(rangeDays("7")).toBe(7);
  expect(rangeDays("90")).toBe(90);
  expect(rangeDays("365")).toBe(30);
  expect(rangeDays(undefined)).toBe(30);
  const w = windowOf(7, new Date("2026-11-03T15:00:00Z"));
  expect(w).toEqual({ from: "2026-10-28", to: "2026-11-03" });
  expect(daysIn(w.from, w.to)).toHaveLength(7);
});

test("qrTarget allows only pinoypages.ca /go, /card, /qr", () => {
  expect(qrTarget("https://pinoypages.ca/go/abc")).toEqual({ path: "/go/abc", follow: true });
  expect(qrTarget("https://www.pinoypages.ca/card/z-1")?.follow).toBe(true);
  expect(qrTarget("https://pinoypages.ca/qr/x")?.follow).toBe(false);
  for (const bad of ["http://pinoypages.ca/go/a", "https://evil.com/go/a", "https://pinoypages.ca.evil.com/go/a", "https://pinoypages.ca/business/a", "https://u@pinoypages.ca/go/a", "nonsense"])
    expect(qrTarget(bad)).toBeNull();
});

for (const p of ["/admin/dashboard", "/admin/qr"]) {
  test(`${p} needs the admin key and is noindex`, async ({ page, request }) => {
    expect((await request.get(p)).status()).toBe(404);
    expect((await request.get(`${p}?key=wrong`)).status()).toBe(404);
    const r = await page.goto(`${p}?key=test-admin-key&days=7`);
    expect(r?.status()).toBe(200);
    await expect(page.getByTestId("no-db")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: "7 days" })).toHaveAttribute("aria-current", "page");
  });
}

test("unknown QR code 404s", async ({ request }) => {
  expect((await request.get("/qr/nope-123", { maxRedirects: 0 })).status()).toBe(404);
});
