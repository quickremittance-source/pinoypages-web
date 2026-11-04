import { expect, test } from "@playwright/test";
import { parseAdForm, parseListingForm, sortRows, type MetricRow } from "../src/lib/adminEdit";

const fd = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });
const PAGES = ["/admin", "/admin/listings", "/admin/listings/x", "/admin/ads/manage", "/admin/ads/x"];

test("admin hub and editor pages 404 without the key or with a wrong key", async ({ request }) => {
  for (const p of PAGES) {
    expect((await request.get(p)).status(), p).toBe(404);
    expect((await request.get(`${p}?key=wrong`)).status(), p).toBe(404);
  }
});

test("with the key (no DB here): noindex, admin nav, no-database notice, nothing public links to admin", async ({ page }) => {
  for (const p of ["/admin/listings", "/admin/ads/manage", "/admin/listings/x", "/admin/ads/x"]) {
    await page.goto(`${p}?key=test-admin-key`);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(page.getByTestId("no-db")).toBeVisible();
  }
  await page.goto("/admin?key=test-admin-key");
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Listings" })).toBeVisible();
  for (const p of ["/", "/directory", "/advertise"]) {
    await page.goto(p);
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  }
});

test("listing form validation", () => {
  const ok = parseListingForm(fd({ name: " Ate Ging ", tier: "free", status: "hidden", website: "https://x.ca", locked: "on" }));
  expect(ok).toMatchObject({ name: "Ate Ging", tier: "free", status: "hidden", verified: false, locked: true, website: "https://x.ca" });
  expect(() => parseListingForm(fd({ tier: "free", status: "published" }))).toThrow(/name/);
  expect(() => parseListingForm(fd({ name: "a", tier: "gold", status: "published" }))).toThrow(/tier/);
  expect(() => parseListingForm(fd({ name: "a", tier: "free", status: "archived" }))).toThrow(/status/);
  expect(() => parseListingForm(fd({ name: "a", tier: "verified", status: "published", verified: "on" }))).toThrow(/verified_until/);
  expect(() => parseListingForm(fd({ name: "a", tier: "free", status: "published", website: "javascript:x" }))).toThrow(/website/);
});

test("ad form validation", () => {
  expect(parseAdForm(fd({ name: "A", tier: "half", status: "live", start_date: "2026-11-01", end_date: "2026-12-01" }))).toMatchObject({ tier: "half", status: "live" });
  expect(() => parseAdForm(fd({ name: "A", tier: "half", status: "live", start_date: "2026-12-01", end_date: "2026-11-01" }))).toThrow(/before/);
  expect(() => parseAdForm(fd({ name: "A", tier: "poster", status: "live" }))).toThrow(/tier/);
});

test("hub table sorting", () => {
  const r = (name: string, views: number, scans: number): MetricRow => ({ kind: "listing", ref: name, name, status: "published", views, clicks: 0, contacts: 0, scans, codes: [] });
  const rows = [r("b", 1, 9), r("a", 5, 1), r("c", 3, 3)];
  expect(sortRows(rows, undefined, undefined).map((x) => x.name)).toEqual(["a", "c", "b"]);
  expect(sortRows(rows, "scans", "asc").map((x) => x.name)).toEqual(["a", "c", "b"]);
  expect(sortRows(rows, "name", "asc").map((x) => x.name)).toEqual(["a", "b", "c"]);
  expect(sortRows(rows, "bogus; drop", "desc").map((x) => x.name)).toEqual(["a", "c", "b"]);
});

test("Brevo sync skips locked listings; migration 009 adds lock, archive and audit", async () => {
  const fs = await import("node:fs");
  const sync = fs.readFileSync("scripts/import-brevo-listings.mjs", "utf8");
  expect(sync).toContain("where listings.locked is not true");
  expect(sync).toContain("and locked is not true");
  const m = fs.readFileSync("db/migrations/009_admin_editor.sql", "utf8");
  for (const s of ["locked boolean", "archived_at", "admin_audit", "start_date"]) expect(m).toContain(s);
});
