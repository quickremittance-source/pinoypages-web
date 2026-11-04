import { login } from "./adminLogin";
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
    await login(page);
    const r = await page.goto(`${p}?days=7`);
    expect(r?.status()).toBe(200);
    await expect(page.getByTestId("no-db")).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByRole("link", { name: "7 days" })).toHaveAttribute("aria-current", "page");
  });
}

test("unknown QR code 404s", async ({ request }) => {
  expect((await request.get("/qr/nope-123", { maxRedirects: 0 })).status()).toBe(404);
});

test("qr-create script locks targets and builds per-label codes", async () => {
  const { execFileSync } = await import("node:child_process");
  const run = (...a: string[]) =>
    execFileSync("node", ["scripts/qr-create.mjs", "--dry-run", ...a], { encoding: "utf8", env: { ...process.env, DATABASE_URL: "" } });
  const out = JSON.parse(run("--listing", "abc", "--label", "Magazine p.12", "--target", "https://pinoypages.ca/go/abc"));
  expect(out).toMatchObject({ code: "magazine-p-12-abc", placement: "Magazine p.12", url: "https://pinoypages.ca/qr/magazine-p-12-abc" });
  expect(JSON.parse(run("--listing", "abc", "--label", "storefront", "--target", "https://pinoypages.ca/card/abc")).code).toBe("storefront-abc");
  expect(() => run("--listing", "abc", "--label", "x", "--target", "https://evil.com/go/abc")).toThrow();
  expect(() => run("--listing", "abc", "--label", "x", "--target", "https://pinoypages.ca/qr/abc")).toThrow();
});

test("ad daily event mapping", async () => {
  const src = (await import("node:fs")).readFileSync("src/lib/adsRepo.ts", "utf8");
  expect(src).toContain("insert into ad_event_daily");
  expect((await import("node:fs")).readFileSync("src/lib/analytics/store.ts", "utf8")).toContain("insert into listing_event_daily");
});
