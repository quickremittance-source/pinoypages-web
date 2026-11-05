import { login } from "./adminLogin";
import { expect, test } from "@playwright/test";
import {
  groupByCodeDay,
  makeTrackingId,
  parseLandingForm,
  parseListingAction,
  parseQrLabel,
  parseTab,
  zcardQrUrl,
} from "../src/lib/adminZcard";
import { windowOf, daysIn } from "../src/lib/dashRange";

const fd = (o: Record<string, string>) => ({ get: (k: string) => o[k] ?? null });

const PRIVATE = [
  "/admin/zcard",
  "/admin/zcard/demo-card",
  "/admin/zcard/demo-card?tab=qr",
  "/admin/zcard/demo-card?tab=landing",
  "/admin/zcard/demo-card?tab=listing",
  "/admin/zcard/demo-card/qr/dz5r1/qr.png",
  "/admin/zcard/demo-card/qr/dz5r1/qr.pdf",
];

test("admin zcard pages and downloads 404 without a session", async ({ request }) => {
  for (const p of PRIVATE) {
    expect((await request.get(p)).status(), p).toBe(404);
    expect((await request.get(`${p}${p.includes("?") ? "&" : "?"}key=wrong`)).status(), p).toBe(404);
  }
});

test("tab parsing, labels, landing and listing validation", () => {
  expect(parseTab("qr")).toBe("qr");
  expect(parseTab("landing")).toBe("landing");
  expect(parseTab("nope")).toBe("analytics");
  expect(parseTab(undefined)).toBe("analytics");
  expect(parseQrLabel("  Magazine p.12  ")).toBe("Magazine p.12");
  expect(() => parseQrLabel("   ")).toThrow(/label/);
  expect(makeTrackingId("Magazine p.12", [])).toBe("magazinep1");
  expect(makeTrackingId("Magazine p.12", ["magazinep1"])).toBe("magazinep12");
  expect(zcardQrUrl("demo-card", "dz5r1")).toBe("https://pinoypages.ca/zcard/demo-card?src=qr&t=dz5r1");
  const ok = parseLandingForm(
    fd({
      name: " Cafe ",
      phone: "+14165550100",
      mapQuery: "Toronto, ON",
      tagline: "Hello",
      offer: "10% off",
      services: "Eat\nDrink\n",
      website: "https://example.com",
      whatsapp: "14165550100",
    }),
  );
  expect(ok).toMatchObject({ name: "Cafe", website: "https://example.com", services: ["Eat", "Drink"] });
  expect(() => parseLandingForm(fd({ phone: "1", mapQuery: "x" }))).toThrow(/name/);
  expect(() => parseLandingForm(fd({ name: "A", phone: "1", mapQuery: "x", website: "javascript:x" }))).toThrow(
    /website/,
  );
  expect(parseListingAction(fd({ op: "link", listing_id: "ate-ging" }))).toEqual({ op: "link", listingId: "ate-ging" });
  expect(() => parseListingAction(fd({ op: "unlink" }))).toThrow(/confirm/);
  expect(parseListingAction(fd({ op: "unlink", confirm: "on" }))).toEqual({ op: "unlink" });
});

test("analytics grouping fills Toronto days around DST transitions", () => {
  const spring = windowOf(3, new Date("2026-03-09T16:00:00Z"));
  expect(spring).toEqual({ from: "2026-03-07", to: "2026-03-09" });
  expect(daysIn(spring.from, spring.to)).toEqual(["2026-03-07", "2026-03-08", "2026-03-09"]);
  const fall = windowOf(3, new Date("2026-11-02T17:00:00Z"));
  expect(fall).toEqual({ from: "2026-10-31", to: "2026-11-02" });
  const grouped = groupByCodeDay([{ code: "abcd", label: "flyer", day: "2026-11-01", n: 2 }], fall.from, fall.to);
  expect(grouped[0]).toMatchObject({ code: "abcd", label: "flyer", total: 2 });
  expect(grouped[0]?.days.map((d) => d.n)).toEqual([0, 2, 0]);
});

test("signed-in admin can open the ZCard index, all four tabs, and downloads", async ({ page }) => {
  await login(page);
  await page.goto("/admin/zcard");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.getByRole("heading", { name: "ZCard ads" })).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "ZCards" })).toBeVisible();
  await expect(page.getByTestId("zcard-table")).toContainText("demo-card");
  await expect(page.getByTestId("no-db")).toBeVisible();
  await page.getByRole("link", { name: "Open" }).click();
  await expect(page.getByRole("heading", { name: /ZCard:/ })).toBeVisible();
  await expect(page.getByTestId("zcard-tabs")).toBeVisible();
  await expect(page.getByTestId("zcard-analytics")).toBeVisible();
  await expect(
    page.getByRole("navigation", { name: "ZCard sections" }).getByRole("link", { name: "Analytics" }),
  ).toHaveAttribute("aria-current", "page");

  await page.goto("/admin/zcard/demo-card?tab=bogus");
  await expect(page.getByTestId("zcard-analytics")).toBeVisible();

  await page.goto("/admin/zcard/demo-card?tab=qr");
  await expect(page.getByTestId("zcard-qr")).toBeVisible();
  await expect(page.getByTestId("zcard-qr-table")).toContainText("dz5r1");
  await expect(page.getByRole("link", { name: "Download PNG for dz5r1" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Download PDF for dz5r1" })).toBeVisible();

  await page.goto("/admin/zcard/demo-card?tab=landing");
  await expect(page.getByTestId("zcard-landing-form").locator('input[name="name"]')).toHaveValue(/Sample Business/);

  await page.goto("/admin/zcard/demo-card?tab=listing");
  await expect(page.getByTestId("zcard-listing")).toContainText("No directory listing is linked");

  const png = await page.request.get("/admin/zcard/demo-card/qr/dz5r1/qr.png");
  expect(png.status()).toBe(200);
  expect(png.headers()["content-type"]).toContain("image/png");
  expect(png.headers()["cache-control"]).toMatch(/private|no-store/);
  expect(png.headers()["content-disposition"]).toContain("zcard-demo-card-dz5r1.png");
  const { PNG } = await import("pngjs");
  const { default: jsQR } = await import("jsqr");
  const img = PNG.sync.read(Buffer.from(await png.body()));
  const decoded = jsQR(new Uint8ClampedArray(img.data), img.width, img.height);
  expect(decoded?.data).toBe("https://pinoypages.ca/zcard/demo-card?src=qr&t=dz5r1");

  const pdf = await page.request.get("/admin/zcard/demo-card/qr/dz5r1/qr.pdf");
  expect(pdf.status()).toBe(200);
  expect(pdf.headers()["content-type"]).toContain("application/pdf");
  expect(
    Buffer.from(await pdf.body())
      .subarray(0, 5)
      .toString(),
  ).toBe("%PDF-");

  expect((await page.request.get("/admin/zcard/demo-card/qr/zzzz/qr.png")).status()).toBe(404);
  expect((await page.request.get("/admin/zcard/demo-card/qr/df7k2/qr.png")).status()).toBe(404);
});

test("unknown and non-zcard slugs 404 for an admin", async ({ page, request }) => {
  await login(page);
  expect((await request.get("/admin/zcard/does-not-exist")).status()).toBe(404);
  // request fixture has no admin cookie; use the signed-in page request
  expect((await page.request.get("/admin/zcard/does-not-exist")).status()).toBe(404);
  expect((await page.request.get("/admin/zcard/demo-full")).status()).toBe(404);
});

test("public pages do not link to /admin/zcard", async ({ page }) => {
  for (const p of ["/", "/directory", "/advertise", "/zcard"]) {
    await page.goto(p);
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  }
});
