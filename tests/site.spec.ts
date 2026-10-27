import { readFileSync } from "node:fs";
import path from "node:path";
import ideasData from "../content/story-ideas.json";
import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { TEST_ENV } from "../playwright.config";
import AxeBuilder from "@axe-core/playwright";
import guideJson from "../content/guide.json";
// Samples removed on alt-design: listings is empty in the JSON, so type it explicitly.
const guide = { ...guideJson, listings: guideJson.listings as unknown as Listing[] };
import pub from "../content/public-listings.json";
import { badgeState, isVerified, listings as allListings, mutualPartners, type Listing } from "../src/lib/guide";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const routes = [...new Set(guide.pages.map((p) => p.route))].concat([
  "/classic",
  "/directory",
  "/edition",
  "/magazine",
  "/magazine/do-i-need-hst",
  "/magazine/do-i-need-hst/tl",
  "/magazine/meet-bituin-tax",
  "/magazine/fhsa-first-home",
  "/magazine/ideas",
  "/calendar/ev-sample-featured",
  "/calendar/ev-newcomer-jan",
  "/list-free",
  "/calendar",
  "/upgrade",
  "/privacy",
  "/terms",
  "/directory/money-business",
  "/get-verified",
  "/awards",
]);

for (const path of [...new Set(routes)]) {
  test(`${path} renders and passes axe`, async ({ page }) => {
    const res = await page.goto(path);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });
}

test("every printed QR target (with UTM) resolves and canonical drops UTM", async ({ page }) => {
  for (const p of guide.pages.filter((x) => x.section !== "cover")) {
    const res = await page.goto(`${p.route}?utm_source=guide&utm_medium=qr&utm_campaign=x&utm_content=p${p.page}`);
    expect(res?.status(), `page ${p.page}`).toBe(200);
    expect(await page.locator('link[rel="canonical"]').getAttribute("href")).not.toContain("utm_");
  }
});

test("all ad slots (11 + calendar sponsor) show on /advertise as the online preview; none on pilot pages", async ({
  page,
}) => {
  await page.goto("/advertise");
  await expect(page.getByRole("heading", { name: /Online ad spaces \(preview\)/ })).toBeVisible();
  expect(await page.locator('aside[aria-label^="Ad space"], aside[aria-label^="Advertisement"]').count()).toBe(
    guide.ads.length,
  );
  for (const r of ["/", "/directory", "/get-verified", "/upgrade"]) {
    await page.goto(r);
    await expect(page.locator('aside[aria-label^="Ad space"], aside[aria-label^="Advertisement"]')).toHaveCount(0);
  }
});

test("HST checker verdicts", async ({ page }) => {
  await page.goto("/tools/hst-checker");
  const q = page.getByLabel(/Quarter \d sales/);
  for (let i = 0; i < 4; i++) await q.nth(i).fill("5000");
  await expect(page.getByRole("status")).toContainText("small supplier");
  await q.nth(0).fill("12000");
  await q.nth(1).fill("12000");
  await expect(page.getByRole("status")).toContainText("must register by the end of the month");
  await q.nth(2).fill("31000");
  await expect(page.getByRole("status")).toContainText("One quarter is over $30,000");
});

test("CPP estimator caps at 2026 maximums", async ({ page }) => {
  await page.goto("/tools/cpp-estimator");
  const input = page.getByLabel(/net self-employment income/);
  await input.fill("50000");
  await expect(page.getByTestId("cpp-total")).toContainText("5,533.50");
  await input.fill("200000");
  await expect(page.getByTestId("cpp-total")).toContainText("9,292.90");
});

test("claim flow from a listing validates then succeeds", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/directory/tax-accounting");
  await page.getByRole("link", { name: "Claim it free" }).first().click();
  await expect(page).toHaveURL(/\/upgrade\?listing=/);
  await expect(page.getByText("Claiming:")).toBeVisible();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Verified", { exact: true }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("ad inquiry form validates then succeeds", async ({ page }) => {
  await page.goto("/advertise?slot=slot-03");
  await expect(page.getByRole("heading", { name: /space slot-03/ })).toBeVisible();
  await page.getByRole("button", { name: "Send ad enquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel(/interested in/).selectOption("ad-half");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send ad enquiry" }).click();
  await expect(page.getByRole("status").first()).toContainText("We received your request");
});

test("security + noindex headers", async ({ request }) => {
  const h = (await request.get("/")).headers();
  expect(h["content-security-policy"]).toContain("default-src 'self'");
  expect(h["x-robots-tag"]).toContain("noindex");
  expect(h["x-frame-options"]).toBe("DENY");
});

test("unknown routes 404", async ({ page }) => {
  expect((await page.goto("/listing/nope"))?.status()).toBe(404);
  expect((await page.goto("/directory/nope"))?.status()).toBe(404);
});

const site = process.env.NEXT_PUBLIC_SITE_URL ?? guide.brand.siteUrl;
function decode(buf: Buffer) {
  const png = PNG.sync.read(buf);
  return jsQR(new Uint8ClampedArray(png.data), png.width, png.height)?.data;
}

const paid = guide.listings.filter((l) => l.tier !== "free");
const free = guide.listings.filter((l) => l.tier === "free");

test("paid tiers: branded QR decodes to their counted /go/ link; free listings have no QR files", async ({
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  expect(paid.length).toBeGreaterThan(0);
  for (const l of paid) {
    const png = await request.get(`/qr/${l.id}/qr.png`);
    expect(png.headers()["content-type"]).toBe("image/png");
    expect(decode(await png.body())).toBe(`${site}/go/${l.id}`);
    expect(await (await request.get(`/qr/${l.id}/qr.svg`)).text()).toContain("Find us on");
    const pdf = await request.get(`/qr/${l.id}/qr.pdf`);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
    // QR counter card: included in every Verified listing.
    const counter = await request.get(`/qr/${l.id}/counter.pdf`);
    expect(counter.status(), l.id).toBe(200);
    expect((await counter.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
  for (const l of free) {
    for (const f of ["qr.png", "qr.svg", "qr.pdf", "counter.pdf", "basic.png"])
      expect((await request.get(`/qr/${l.id}/${f}`)).status()).toBe(404);
    expect((await request.get(`/go/${l.id}`, { maxRedirects: 0 })).status()).toBe(404);
    expect((await request.get(`/vcard/${l.id}.vcf`)).status()).toBe(404);
  }
});

test("/go/ counted link redirects paid listings with UTM", async ({ request }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const res = await request.get("/go/ind-01", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(
    /\/card\/ind-01\?utm_source=own-qr&utm_medium=qr&utm_campaign=lister&utm_content=ind-01$/,
  );
  expect((await request.get("/go/nope", { maxRedirects: 0 })).status()).toBe(404);
  const call = await request.get("/go/tax-01?via=call", { maxRedirects: 0 });
  expect(call.headers()["location"]).toBe("tel:416-555-0101".replace(/-/g, ""));
  const tap = await request.get("/go/tax-01?via=tap", { maxRedirects: 0 });
  expect(tap.headers()["location"]).toContain("utm_medium=tap");
});

test("vCard downloads are valid for paid tiers", async ({ request }) => {
  for (const l of paid) {
    const res = await request.get(`/vcard/${l.id}.vcf`);
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("text/vcard");
    const v = await res.text();
    const lines = v.trim().split("\r\n");
    expect(lines[0]).toBe("BEGIN:VCARD");
    expect(lines[1]).toBe("VERSION:3.0");
    expect(lines.at(-1)).toBe("END:VCARD");
    expect(v).toContain(`FN:${l.name}`);
    expect(v).toContain(`TEL;TYPE=WORK,VOICE:${l.phone}`);
    expect(v).toContain(`URL:${site}/listing/${l.id}`);
  }
});

test("free listing page = name + contact only: no QR, no Save contact, no badge, no ZCard", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/listing/tax-02");
  await expect(page.getByText("905-555-0102")).toBeVisible();
  await expect(page.getByRole("img", { name: /QR code/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save contact" })).toHaveCount(0);
  await expect(page.getByTestId("vk-badge")).toHaveCount(0);
  await expect(page.getByTestId("zcard-bridge")).toHaveCount(0);
  await expect(page.getByText(guide.brand.zcardMark)).toHaveCount(0);
  await expect(page.getByLabel("Photos")).toHaveCount(0);
  await expect(page.getByText("Languages")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Upgrade to Verified" })).toBeVisible();
});

test("paid = eligible, not verified: badge + date only after the visit; ZCard bridge on every paid page", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  for (const l of paid) {
    await page.goto(`/listing/${l.id}`);
    const bridge = page.getByTestId("zcard-bridge");
    await expect(bridge).toBeVisible();
    await expect(bridge.getByText(guide.brand.zcardMark)).toBeVisible();
    await expect(bridge.getByText(guide.brand.qrLine)).toBeVisible();
    await expect(bridge.getByRole("link", { name: "Save contact" })).toHaveAttribute("href", `/vcard/${l.id}.vcf`);
    const state = badgeState(l as Listing);
    await expect(bridge.getByTestId("vk-badge")).toHaveCount(state === "active" ? 1 : 0);
    if (state === "active") await expect(bridge.getByText(/· Verified \w{3} \d{1,2}, \d{4}/)).toBeVisible();
    else if (state === "paused") await expect(bridge.getByTestId("vk-paused")).toBeVisible();
    else if (state === "expired") await expect(bridge.getByTestId("vk-expired")).toBeVisible();
    else await expect(bridge.getByTestId("verification-pending")).toBeVisible();
  }
  // ind-01 is Verified (everything included) but not yet visited: no badge anywhere on the page.
  await page.goto("/listing/ind-01");
  await expect(page.getByTestId("vk-badge")).toHaveCount(0);
  await expect(page.getByRole("img", { name: /QR code for/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call / Book" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Counter card (PDF)" })).toBeVisible();
  await page.goto("/listing/tax-01");
  await expect(page.getByRole("link", { name: "Call / Book" })).toHaveAttribute("href", "/go/tax-01?via=call");
  await expect(page.getByLabel("Photos")).toBeVisible();
  await expect(page.getByRole("link", { name: "Print-ready label (PDF)" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Counter card (PDF)" })).toHaveAttribute(
    "href",
    "/qr/tax-01/counter.pdf",
  );
});

test("ZCard bridge never asks for login, payment or personal data", async ({ page }) => {
  for (const l of paid) {
    await page.goto(`/listing/${l.id}`);
    const bridge = page.getByTestId("zcard-bridge");
    await expect(bridge.locator("form, input, select, textarea, iframe")).toHaveCount(0);
    await expect(bridge.getByText(/password|sign in|log ?in to|card number|SIN\b|credit card/i)).toHaveCount(0);
    await expect(bridge.getByText(/never asks for a login, a payment or personal information/)).toBeVisible();
    for (const href of await bridge.locator("a").evaluateAll((as) => as.map((a) => a.getAttribute("href") ?? "")))
      expect(href, l.id).toMatch(/^(\/vcard\/|\/go\/|mailto:)/);
  }
  // The page that QR scans land on has no forms at all.
  await page.goto("/listing/tax-01");
  await expect(page.locator("form, input[type=password]")).toHaveCount(0);
});

test("categories: Money & Business is the live category; Travel, Padala & Remit is coming next edition", async ({
  page,
}) => {
  expect(guide.brand.tagline).toBe("The Filipino Business Directory");
  expect(guide.sections.map((x) => [x.name, x.status])).toEqual([
    ["Money & Business", "live"],
    ["Travel, Padala & Remit", "coming"],
  ]);
  const live = JSON.stringify([guide.categories, guide.listings, guide.ads, guide.adMenu]);
  expect(live).not.toMatch(/remit|padala|money transfer/i);
  await page.goto("/");
  await expect(page.getByTestId("category-tag")).toHaveText("Category: Money & Business");
  await page.goto("/directory");
  await expect(page.getByRole("heading", { name: /Category: Money & Business/ })).toBeVisible();
  const coming = page.locator('[data-section="travel-padala-remit"]');
  await expect(coming).toContainText("Coming next edition");
  await expect(coming.getByRole("link")).toHaveCount(0);
  expect((await page.goto("/directory/remittance"))?.status()).toBe(404);
});

test("directory: free entries are one line; featured shows tagline", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/directory/tax-accounting");
  await expect(page.locator('li[data-tier="free"]').first()).not.toContainText("Tagalog");
  const tax01 = page.locator('li[data-tier="verified"]').filter({ hasText: "Bituin Tax & Bookkeeping" });
  await expect(tax01).toContainText("Personal & self-employed returns");
  await expect(page.locator('li[data-tier="free"]').getByTestId("vk-badge")).toHaveCount(0);
  await expect(tax01.getByTestId("vk-badge")).toBeVisible();
});

test("sold ad mirrors online with corner QR and tap-to-open button", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/magazine");
  const ad = page.getByRole("complementary", { name: /Advertisement: Bituin Tax & Bookkeeping/ });
  await expect(ad.getByRole("img", { name: /QR code for/ })).toBeVisible();
  await expect(ad.getByRole("link", { name: /Tap to open/ })).toHaveAttribute("href", "/go/tax-01?via=tap");
});

// ---------- Per-listing analytics (v1): counting + access control ----------
const hmac = (id: string) =>
  createHmac("sha256", TEST_ENV.ANALYTICS_SECRET).update(`results:${id}`).digest("base64url").slice(0, 32);
const ADMIN = `/admin/analytics?key=${TEST_ENV.ADMIN_KEY}`;
async function count(page: Page, id: string, event: string) {
  await page.goto(ADMIN);
  return Number(await page.locator(`tr[data-listing="${id}"] td[data-event="${event}"]`).innerText());
}

test("analytics: QR scan, call, map, website and ad-tap clicks are counted per listing", async ({ page, request }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const before = {
    scan: await count(page, "ind-01", "scan"),
    call: await count(page, "tax-01", "call"),
    map: await count(page, "tax-01", "map"),
    website: await count(page, "tax-01", "website"),
  };
  expect((await request.get("/go/ind-01", { maxRedirects: 0 })).status()).toBe(307);
  expect((await request.get("/go/tax-01?via=call", { maxRedirects: 0 })).headers().location).toMatch(/^tel:/);
  expect((await request.get("/go/tax-01?via=map", { maxRedirects: 0 })).headers().location).toContain(
    "google.com/maps/search",
  );
  expect((await request.get("/go/tax-01?via=web", { maxRedirects: 0 })).headers().location).toBe(
    "https://example.com/tax-01",
  );
  expect(await count(page, "ind-01", "scan")).toBeGreaterThan(before.scan);
  expect(await count(page, "tax-01", "call")).toBeGreaterThan(before.call);
  expect(await count(page, "tax-01", "map")).toBeGreaterThan(before.map);
  expect(await count(page, "tax-01", "website")).toBeGreaterThan(before.website);
  // Every Verified listing has Call / Book; free listings have no counted links at all.
  expect((await request.get("/go/ind-01?via=call", { maxRedirects: 0 })).status()).toBe(307);
  expect((await request.get("/go/tax-02?via=call", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/go/tax-02?via=map", { maxRedirects: 0 })).status()).toBe(404);
});

test("analytics: listing page views are counted (free listings too); bots and bad input are not", async ({
  page,
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  for (const id of ["ins-01", "tax-03"]) {
    const before = await count(page, id, "view");
    const beacon = page.waitForResponse((r) => r.url().endsWith("/api/stat") && r.status() === 204);
    await page.goto(`/listing/${id}`);
    await beacon;
    expect(await count(page, id, "view")).toBeGreaterThan(before);
  }
  const bot = await request.post("/api/stat", {
    data: JSON.stringify({ id: "ins-02", event: "view" }),
    headers: { "user-agent": "Googlebot/2.1" },
  });
  expect(bot.status()).toBe(202);
  expect((await request.post("/api/stat", { data: "nope" })).status()).toBe(400);
  expect((await request.post("/api/stat", { data: JSON.stringify({ id: "tax-01", event: "scan" }) })).status()).toBe(
    400,
  );
  expect((await request.post("/api/stat", { data: JSON.stringify({ id: "nobody", event: "view" }) })).status()).toBe(
    202,
  );
});

test("analytics access control: signed results links, paid vs free, admin key", async ({ page, request }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  for (const url of ["/results/ind-01", "/results/ind-01?t=wrong", `/results/ind-01?t=${hmac("tax-01")}`])
    expect((await request.get(url)).status()).toBe(404);
  await page.goto(`/results/ind-01?t=${hmac("ind-01")}`);
  await expect(page.getByRole("img", { name: /Views and clicks per month/ })).toBeVisible();
  await expect(page.getByRole("row", { name: /QR scans/ })).toBeVisible();
  await page.goto(`/results/tax-02?t=${hmac("tax-02")}`);
  await expect(page.getByText("Your listing is being counted")).toBeVisible();
  await expect(page.getByRole("link", { name: "Upgrade to see your results" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Views and clicks/ })).toHaveCount(0);
  await expect(page.getByRole("row", { name: /QR scans/ })).toHaveCount(0);
  for (const url of ["/admin/analytics", "/admin/analytics?key=wrong", "/admin/analytics/summary?key=wrong"])
    expect((await request.get(url)).status()).toBe(404);
  const s = await (await request.get(`/admin/analytics/summary?key=${TEST_ENV.ADMIN_KEY}&month=2026-11`)).text();
  expect(s).toContain("DRAFTS ONLY — NOT SENT (2026-11)");
  expect(s).toContain("Bituin Tax & Bookkeeping: your Pinoy Pages counts for November 2026");
  expect(s).toContain("not a promise of future results");
  expect(s).not.toContain("Araw CPA Professional Corp."); // free listing: counted, never emailed
});

test("Money & Business Calendar: CRA deadlines, free vs featured events, sponsor slot, prices in config", async ({
  page,
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const price = Object.fromEntries(guide.eventMenu.map((o) => [o.id, [o.price, o.founding]]));
  expect(price).toEqual({ "event-free": [0, 0], "event-featured": [49, 49] });
  expect(guide.pages.find((p) => p.page === 11)).toMatchObject({ route: "/calendar", ad: "slot-cal" });
  for (const e of guide.events.filter((x) => x.kind === "deadline"))
    expect(e.source).toMatch(/^https:\/\/www\.canada\.ca\//);
  await page.goto("/calendar");
  await expect(page.locator('[data-kind="deadline"]')).toHaveCount(
    guide.events.filter((x) => x.kind === "deadline").length,
  );
  const free = page.locator('#cal [data-list] [data-event-tier="free"][data-kind="community"]');
  // Free basic = text only: the name links to its event page; no image, no Register button.
  for (const li of await free.all()) await expect(li.getByRole("link")).toHaveCount(1);
  await expect(free.locator("img, svg")).toHaveCount(0);
  await expect(free.getByRole("link", { name: "Register" })).toHaveCount(0);
  await expect(
    page.locator('#cal [data-list] [data-event-tier="featured"]').getByRole("link", { name: "Register" }).first(),
  ).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Ad space slot-cal" })).toBeVisible();
  expect((await request.get("/e/ev-sample-free", { maxRedirects: 0 })).status()).toBe(404);
  const before = await count(page, "tax-01", "website"); // sanity: admin reachable
  expect(before).toBeGreaterThanOrEqual(0);
  const r = await request.get("/e/ev-sample-featured", { maxRedirects: 0 });
  expect(r.status()).toBe(307);
  expect(r.headers().location).toBe("https://example.com/register");
  await page.goto("/calendar/ev-sample-featured");
  await expect(page.getByRole("img", { name: /QR code to register/ })).toBeVisible();
  expect((await request.get("/calendar/ev-sample-free")).status()).toBe(200);
});

test("event submission validates then succeeds (member featured event is free)", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await page.getByLabel("Event name *").fill("Test workshop");
  await page.getByLabel("Date *").fill("2027-03-10");
  await page.getByLabel("Place *").fill("Toronto");
  await page.getByLabel("Organizer *").fill("Test Org");
  await page.getByLabel("Organizer email *").fill("org@example.com");
  await page.getByRole("radio", { name: /Featured event/ }).check();
  await page.getByLabel("Member? Choose your paid listing").selectOption("ind-01");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Thanks" })).toContainText(
    "As a member your featured event is free",
  );
});

test("pilot menu = two tiers: Free / Verified $99 one-time (everything included); no add-ons; prices from config", async ({
  page,
}) => {
  const price = Object.fromEntries(guide.adMenu.map((a) => [a.id, a.price]));
  expect(price).toEqual({ free: 0, verified: 99 });
  expect(guide.adMenu.map((a) => a.name)).toEqual(["Free", "Verified"]);
  expect(guide.adMenu.every((a) => a.menu === "main")).toBe(true);
  expect(guide.adMenu.find((a) => a.recommended)?.id).toBe("verified");
  expect(guide.listings.every((l) => ["free", "verified"].includes(l.tier))).toBe(true);
  expect(guide.sponsors).toEqual([]);
  const menu = JSON.stringify(guide.adMenu);
  expect(menu).not.toMatch(/lead|bundle|founding|bronze|silver|gold|platinum|starter|Verified Plus|Verified Ad/i);
  expect(JSON.stringify(guide)).not.toMatch(/\$(159|199|299|350|390|360|450|600|690|850)\b/);
  for (const o of guide.adMenu.filter((x) => x.price > 0)) expect(o.unit).toMatch(/one-time/);
  expect(JSON.stringify(guide)).not.toMatch(/yearbook|guarantee(d)? (leads|results|calls)|results report|pinoypera/i);
  expect(guide.brand.siteUrl).toBe("https://pinoypages.ca");
  expect(guide.brand.badgeRule).toMatch(/one mutual vouch/);
  expect(guide.brand.adsNote).toBe("Print ads are now booking for the 2026–2027 edition.");
  for (const path of ["/upgrade", "/advertise"]) {
    await page.goto(path);
    await expect(
      page.getByText(/Pinoy Pages 2026–2027 · Spring · Summer · Fall · Pilot Edition/).first(),
    ).toBeVisible();
    await expect(page.getByTestId("badge-rule").first()).toContainText("Payment never buys the badge");
    await expect(page.getByTestId("badge-rule").first()).toContainText("one mutual vouch");
    const keep = page.getByTestId("keep-rules").first();
    await expect(keep.getByRole("heading", { name: "Keeping your badge" })).toBeVisible();
    await expect(keep.getByRole("listitem")).toHaveCount(5);
    await expect(keep).toContainText("60 days");
    for (const name of ["Free", "Verified"])
      await expect(page.getByRole("rowheader", { name: new RegExp(`^${name}`) }).first()).toBeVisible();
    await expect(
      page.getByRole("rowheader", {
        name: /^(Verified Plus|Verified Ad|Starter|Featured|Bronze|Silver|Gold|Platinum)/,
      }),
    ).toHaveCount(0);
    await expect(page.getByText(/founding discount|add-on|Invitation-only|Member renewal discount|\$159/i)).toHaveCount(
      0,
    );
    await expect(page.getByText(/pay-per-lead|per lead/i)).toHaveCount(0);
    await expect(page.getByText(/Prices per issue, in CAD, plus applicable HST/)).toBeVisible();
  }
  await page.goto("/upgrade");
  await expect(page.getByText(guide.brand.pitch)).toBeVisible();
  await expect(page.getByText("Print page 19")).toBeVisible();
  expect(guide.pages.find((p) => p.page === 19)).toMatchObject({ route: "/upgrade" });
  await page.goto("/upgrade?listing=tax-03");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Verified", { exact: true }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
  // Terms: Verified is $99 one-time; no renewal discount.
  await page.goto("/terms");
  await expect(page.getByText(/payment never buys the badge/i)).toBeVisible();
  await expect(page.getByText(/renewal discount|20% off|\$159|\$199/i)).toHaveCount(0);
  await expect(page.getByRole("row", { name: /Verified \$99/ })).toBeVisible();
  await expect(page.getByText(/Keeping your badge — vouch: .*60-day grace period/)).toBeVisible();
  await expect(
    page.getByText(/Keeping your badge — complaints: a complaint pauses the badge pending review/),
  ).toBeVisible();
  await expect(page.getByText(/drops to a Free listing/)).toBeVisible();
  await expect(page.getByText(/No guarantee of results/)).toBeVisible();
});

test("edition = magazine up front + directory at back; 20 pages, 11 ad slots + calendar sponsor; Spring/Summer/Fall calendar", async ({
  page,
  request,
}) => {
  expect(guide.brand.editionName).toBe("Pinoy Pages 2026–2027");
  expect(guide.pages).toHaveLength(20);
  expect(guide.ads.filter((a) => a.id !== "slot-cal")).toHaveLength(11);
  expect(guide.pages.filter((p) => p.part === "directory" && p.section === "directory")).toHaveLength(4);
  expect(guide.pages.filter((p) => p.section === "calendar")).toHaveLength(1);
  expect(guide.pages.find((p) => p.page === 11)).toMatchObject({ route: "/calendar", ad: "slot-cal" });
  expect(JSON.stringify(guide.pages)).not.toMatch(/destination|boracay|palawan|cebu/i);
  const mag = guide.pages.filter((p) => p.part === "magazine").map((p) => p.page);
  expect(Math.max(...mag)).toBeLessThan(
    Math.min(...guide.pages.filter((p) => p.part === "directory").map((p) => p.page)),
  );
  expect((await request.get("/destinations")).status()).toBe(404);
  expect((await request.get("/tools/hst", { maxRedirects: 0 })).headers().location).toContain("/tools/hst-checker");
  await page.goto("/edition");
  await expect(page.getByRole("heading", { name: "Magazine" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Directory" })).toBeVisible();
  await page.goto("/magazine/do-i-need-hst");
  await expect(page.getByText("Print page 5")).toBeVisible();
  await expect(page.getByRole("link", { name: "Basahin sa Tagalog" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the free tool" })).toHaveAttribute("href", "/tools/hst-checker");
  await page.goto("/calendar");
  for (const s of ["spring", "summer", "fall"])
    await expect(page.locator(`[data-season="${s}"]`).first()).toBeVisible();
  const sitemap = await (await request.get("/sitemap.xml")).text();
  for (const t of guide.tools) expect(sitemap.includes(t.route)).toBe(t.enabled);
});

test("member email sign-up needs explicit consent (contacts adapter = local store)", async ({ page }) => {
  await page.goto("/magazine?utm_source=facebook");
  const form = page.getByRole("form", { name: "Monthly member email sign-up" });
  await form.getByLabel("Email *").fill("member@example.com");
  await form.getByRole("button", { name: "Sign me up" }).click();
  await expect(form.getByText("Please agree so we can email you")).toBeVisible();
  await form.getByLabel("Email *").fill("member@example.com");
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Sign me up" }).click();
  await expect(form.getByRole("status")).toContainText("monthly member email");
});

// ---------- Badge upkeep: 12-month validity, active status, mutual vouch (+60-day grace), paused state ----------
const L = (id: string) => allListings.find((l) => l.id === id)!;
const at = (iso: string) => new Date(`${iso}T12:00:00Z`);

test("badge logic: shows only within 12 months of the verification date and only when status is active", () => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const tax = L("tax-01"); // verified 2026-11-20 (matches print), founding vouch + mutual vouches with ins-01 and biz-01
  expect(badgeState(tax, at("2026-12-01"))).toBe("active");
  expect(badgeState(tax, at("2027-11-19"))).toBe("active");
  expect(badgeState(tax, at("2027-11-20"))).toBe("expired");
  expect(isVerified(tax, at("2028-01-01"))).toBe(false);
  // Paused: never shown, whatever the date.
  const paused: Listing = { ...tax, badge: { ...tax.badge!, status: "paused" } };
  expect(badgeState(paused, at("2026-12-01"))).toBe("paused");
  expect(isVerified(paused, at("2026-12-01"))).toBe(false);
  // Free listings and unvisited Verified listings never show the badge.
  expect(badgeState(L("tax-02"), at("2026-12-01"))).toBe("none");
  expect(badgeState(L("ind-01"), at("2026-12-01"))).toBe("pending");
});

test("badge logic: one mutual vouch is required (founding vouch at the visit, or a 60-day grace after removal)", () => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const ins = L("ins-01"); // mutual with tax-01, no founding vouch
  expect(badgeState(ins, at("2026-12-01"))).toBe("active");
  // One-sided vouch does not count.
  const others = allListings.map((l) => (l.id === "tax-01" ? { ...l, badge: { ...l.badge!, vouches: [] } } : l));
  expect(badgeState(ins, at("2026-12-01"), others)).toBe("pending");
  // Vouch removed: 60-day grace, then paused.
  const lost: Listing = { ...ins, badge: { ...ins.badge!, vouches: [], vouchLostOn: "2026-12-01" } };
  expect(badgeState(lost, at("2027-01-29"), others)).toBe("active");
  expect(badgeState(lost, at("2027-02-15"), others)).toBe("paused");
  // Founding members are vouched for at the visit.
  expect(badgeState(L("biz-01"), at("2026-12-01"))).toBe("active");
});

test("paused badge: listing keeps its Verified page, but no badge anywhere; directory marks it paused", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const p = guide.listings.find((l) => l.badge?.status === "paused")!;
  expect(p.tier).toBe("verified");
  await page.goto(`/listing/${p.id}`);
  await expect(page.getByTestId("vk-badge")).toHaveCount(0);
  await expect(page.getByTestId("vk-paused")).toContainText("Badge paused pending review");
  await expect(page.getByTestId("zcard-bridge").getByRole("link", { name: "Save contact" })).toBeVisible();
  await page.goto(`/directory/${p.category}`);
  const li = page.locator(`li[data-badge="paused"]`);
  await expect(li).toHaveCount(1);
  await expect(li.getByTestId("vk-badge")).toHaveCount(0);
  await expect(page.locator('li[data-badge="active"]').first().getByTestId("vk-badge")).toBeVisible();
});

test("mutual partner stars show on active badges only", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/listing/tax-01");
  await expect(page.getByTestId("partner-stars")).toContainText("2 mutual partners");
  await page.goto("/listing/ins-03");
  await expect(page.getByTestId("partner-stars")).toHaveCount(0);
});

// ---------- Prototype v1: search, ZCard bridge pages, /go counting, report demo, home, awards ----------
const visible = (page: Page) => page.locator("#results li[data-listing]:visible");

test("directory search filters by name, sub-category, city and language (and syncs the URL)", async ({ page }) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/directory");
  const search = page.getByRole("search", { name: "Search the directory" });
  await expect(search.getByTestId("search-count")).toHaveText(
    `${guide.listings.length + pub.listings.length} businesses shown`,
  );
  await search.getByLabel("Business name").fill("bituin");
  await expect(visible(page)).toHaveCount(1);
  await expect(visible(page).first()).toHaveAttribute("data-listing", "tax-01");
  await expect(search.getByTestId("search-count")).toHaveText("1 business shown");
  await expect(page).toHaveURL(/\?q=bituin$/);
  await search.getByRole("button", { name: "Clear" }).click();
  await search.getByLabel("City").selectOption("Mississauga");
  const miss = guide.listings.filter((l) => l.area === "Mississauga");
  await expect(visible(page)).toHaveCount(miss.length);
  for (const city of await visible(page).evaluateAll((els) => els.map((e) => e.getAttribute("data-city"))))
    expect(city).toBe("Mississauga");
  await search.getByLabel("Language").selectOption("Cebuano");
  const both = miss.filter((l) => l.languages.includes("Cebuano")).map((l) => l.id);
  await expect(visible(page)).toHaveCount(both.length);
  await expect(page).toHaveURL(/city=Mississauga/);
  await expect(page).toHaveURL(/lang=Cebuano/);
  await search.getByRole("button", { name: "Clear" }).click();
  await search.getByLabel("Sub-category").selectOption("independents");
  await expect(visible(page)).toHaveCount(guide.listings.filter((l) => l.category === "independents").length);
  await search.getByLabel("Business name").fill("zzz-nothing");
  await expect(visible(page)).toHaveCount(0);
  await expect(search.getByTestId("search-count")).toContainText("No businesses match");
  await expect(page.locator('#results [data-group="verified"]')).toBeHidden();
  // A shared filtered link opens pre-filtered; the home page search lands here too.
  await page.goto("/directory?lang=Ilocano");
  await expect(visible(page)).toHaveCount(guide.listings.filter((l) => l.languages.includes("Ilocano")).length);
  await page.goto("/");
  await page.getByRole("search", { name: "Find a business" }).getByLabel("Business name").fill("perlas");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/directory\?q=perlas/);
  await expect(visible(page)).toHaveCount(1);
});

test("directory cards: Free = one text line; Verified = card with logo, badge + date, stars, Call/Book, .vcf, QR, states", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/directory/money-business");
  const free = page.locator('li[data-tier="free"]');
  await expect(free).toHaveCount(guide.listings.filter((l) => l.tier === "free").length);
  await expect(free.first().getByRole("img")).toHaveCount(0);
  await expect(free.first().getByRole("link", { name: "Save contact" })).toHaveCount(0);
  const tax = page.locator('li[data-listing="tax-01"]');
  await expect(tax.getByTestId("vk-badge")).toContainText(/Verified Kabayan · Verified Nov 20, 2026/);
  await expect(tax).toContainText("2 mutual partners");
  await expect(tax.getByRole("link", { name: "Call / Book" })).toHaveAttribute("href", "/go/tax-01?via=call");
  await expect(tax.getByRole("link", { name: "Save contact" })).toHaveAttribute("href", "/vcard/tax-01.vcf");
  await expect(tax.getByRole("link", { name: "ZCard", exact: true })).toHaveAttribute("href", "/card/tax-01");
  await expect(page.locator('li[data-listing="ins-04"]')).toHaveAttribute("data-badge", "expired");
  await expect(page.locator('li[data-listing="ins-04"]').getByTestId("vk-badge")).toHaveCount(0);
  await expect(page.locator('li[data-listing="ins-04"]')).toContainText("Badge expired");
  await expect(page.locator('li[data-listing="ins-03"]')).toContainText("Badge paused");
  await expect(page.locator('li[data-listing="ind-01"]')).toContainText("Verification pending");
});

test("ZCard bridge page (/card/<id>): one per Verified listing, mobile-first, no login, payment or personal info", async ({
  page,
  request,
}) => {
  for (const l of paid) {
    const res = await page.goto(`/card/${l.id}`);
    expect(res?.status(), l.id).toBe(200);
    const bridge = page.getByTestId("zcard-bridge");
    await expect(bridge.getByRole("heading", { level: 1 })).toHaveText(l.zcard!.person);
    await expect(bridge.getByRole("link", { name: "Save contact" })).toHaveAttribute("href", `/vcard/${l.id}.vcf`);
    await expect(bridge.getByText(guide.brand.qrLine)).toBeVisible();
    await expect(page.locator("main").locator("form, input, select, textarea, iframe")).toHaveCount(0);
    await expect(page.getByText(/password|sign in|log ?in to|card number|credit card/i)).toHaveCount(0);
    const state = badgeState(l as Listing);
    await expect(bridge).toHaveAttribute("data-state", state);
    await expect(bridge.getByTestId("vk-badge")).toHaveCount(state === "active" ? 1 : 0);
    if (state === "active") {
      await expect(bridge.getByText(/· Verified \w{3} \d{1,2}, \d{4}/)).toBeVisible();
      const n = mutualPartners(l as Listing).length;
      if (n) await expect(bridge.getByTestId("partner-stars")).toContainText(`${n} mutual partner`);
    }
    if (state === "expired") await expect(bridge.getByTestId("vk-expired")).toBeVisible();
    if (state === "paused") await expect(bridge.getByTestId("vk-paused")).toBeVisible();
    if (state === "pending") await expect(bridge.getByTestId("verification-pending")).toBeVisible();
    // Mobile-first: no horizontal scrolling.
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  for (const l of free) expect((await request.get(`/card/${l.id}`)).status()).toBe(404);
});

test("/go/<id> counts every scan and lands on the ZCard; /report/<id> shows the live count + SAMPLE numbers", async ({
  page,
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const id = "biz-03";
  await page.goto(`/report/${id}`);
  await expect(page.getByTestId("sample-banner")).toContainText("SAMPLE");
  await expect(page.getByRole("img", { name: /SAMPLE QR scans per month/ })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  const before = Number(await page.getByTestId("live-scans").innerText());
  for (let i = 0; i < 2; i++) {
    const r = await request.get(`/go/${id}`, { maxRedirects: 0 });
    expect(r.status()).toBe(307);
    expect(r.headers()["location"]).toContain(`/card/${id}?utm_source=own-qr`);
  }
  await page.reload();
  expect(Number(await page.getByTestId("live-scans").innerText())).toBeGreaterThanOrEqual(before + 2);
  // Bots are not counted.
  const now = Number(await page.getByTestId("live-scans").innerText());
  await request.get(`/go/${id}`, { maxRedirects: 0, headers: { "user-agent": "Googlebot/2.1" } });
  await page.reload();
  expect(Number(await page.getByTestId("live-scans").innerText())).toBeLessThanOrEqual(now + 2);
  // Following the redirect opens the ZCard.
  await page.goto(`/go/${id}`);
  await expect(page).toHaveURL(new RegExp(`/card/${id}\\?`));
  await expect(page.getByTestId("zcard-bridge")).toBeVisible();
  // Unlisted: Verified only, never in the sitemap or linked from the site.
  expect((await request.get("/report/tax-02")).status()).toBe(404);
  expect((await request.get("/report/nope")).status()).toBe(404);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/report/");
});

test("home: value proposition, category tiles, featured Verified, Get Verified CTA, free tools teaser", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/classic");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Be the kabayan they can trust — and see proof people found you",
  );
  await expect(page.getByRole("link", { name: /Tax & accounting/ }).first()).toHaveAttribute(
    "href",
    "/directory/tax-accounting",
  );
  const featured = page.getByTestId("featured-verified").locator("li");
  expect(await featured.count()).toBeGreaterThan(0);
  for (const b of await featured.evaluateAll((els) => els.map((e) => e.getAttribute("data-badge"))))
    expect(b).toBe("active");
  await expect(
    page
      .getByRole("main")
      .getByRole("link", { name: /Get Verified/ })
      .first(),
  ).toHaveAttribute("href", "/get-verified");
  for (const href of ["/tools/hst-checker", "/tools/cpp-estimator", "/tax-deadlines", "/calendar"])
    await expect(page.locator(`main a[href="${href}"]`).first()).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
});

test("Get Verified: Free vs Verified, the 4 checks, keeping-your-badge rules, and the claim form", async ({ page }) => {
  await page.goto("/get-verified");
  await expect(page.getByTestId("plan-free")).toContainText("$0");
  await expect(page.getByTestId("plan-verified")).toContainText("$99");
  const checks = page.getByTestId("badge-checks").getByRole("listitem");
  await expect(checks).toHaveCount(4);
  for (const t of ["Kabayan-owned or run", "Really trading", "ZCard completed", "One mutual vouch"])
    await expect(page.getByTestId("badge-checks")).toContainText(t);
  await expect(page.getByTestId("keep-rules").getByRole("listitem")).toHaveCount(5);
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Verified", { exact: true }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("awards preview: three awards + category awards, coming April 2027, nothing to submit", async ({ page }) => {
  await page.goto("/awards");
  await expect(page.getByTestId("awards-coming")).toHaveText("Coming April 2027");
  for (const a of ["Business of the Year", "Ad of the Year", "Kabayan’s Pick"])
    await expect(page.getByRole("heading", { name: a })).toBeVisible();
  await expect(page.getByText(/member vote/)).toBeVisible();
  await expect(page.locator('[data-award^="cat-"]')).toHaveCount(guide.categories.length);
  await expect(page.locator("main form")).toHaveCount(0);
});

test("sample data: ~12+ fictional SAMPLE businesses with 555 numbers across every sub-category", () => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  expect(guide.listings.length).toBeGreaterThanOrEqual(12);
  for (const l of guide.listings) {
    expect(l.sample, l.id).toBe(true);
    expect(l.phone, l.id).toMatch(/^\d{3}-555-01\d{2}$/);
    expect(l.email, l.id).toMatch(/@example\.com$/);
  }
  for (const c of guide.categories) expect(guide.listings.some((l) => l.category === c.slug)).toBe(true);
  expect(allListings.filter((l) => badgeState(l) === "active").length).toBeGreaterThanOrEqual(5);
});

// ---------- Pilot content: rich SAMPLE listings, stories, story ideas ----------

const contactsFile = path.join(process.cwd(), "data", "contacts.jsonl");
const contactsFor = (email: string) =>
  readFileSync(contactsFile, "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l) as { email: string; lists: string[] })
    .filter((c) => c.email === email);
const uniq = (tag: string) => `${tag}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}@example.com`;
const stories = guide.articles.filter((a) => "sample" in a && a.sample) as {
  slug: string;
  file: string;
  title: string;
  listings: string[];
  tools: string[];
}[];

test("sample listings: 20–25 across 4 sub-categories, mostly Verified, with every state represented", () => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  expect(guide.listings.length).toBeGreaterThanOrEqual(20);
  expect(guide.listings.length).toBeLessThanOrEqual(25);
  const states = allListings.map((l) => badgeState(l));
  const n = (s: string) => states.filter((x) => x === s).length;
  expect(n("active")).toBeGreaterThan(guide.listings.length / 2);
  for (const s of ["none", "paused", "expired", "pending"]) expect(n(s), s).toBeGreaterThan(0);
  for (const l of guide.listings) {
    for (const k of ["story", "why", "hours", "serviceArea", "services"] as const)
      expect(l[k as keyof typeof l], `${l.id}.${k}`).toBeTruthy();
    if (l.tier === "verified") expect(l.quote, l.id).toBeTruthy();
    if (l.verifiedOn && l.verifiedOn > "2026-01-01") expect(l.verifiedOn.slice(0, 7), l.id).toBe("2026-11");
  }
  // Writing rules: no stock AI phrasing in the stories.
  expect(JSON.stringify(guide.listings)).not.toMatch(
    /navigate|empower|fast-paced|unlock|journey|seamless|in conclusion/i,
  );
});

test("rich listing page: owner story, SAMPLE quote, why line, hours and service area; free pages stay name + contact", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/listing/tax-01");
  await expect(page.getByTestId("owner-story")).toContainText("Sheppard Avenue");
  await expect(page.getByTestId("owner-quote")).toContainText("SAMPLE quote");
  await expect(page.getByTestId("why-choose")).toBeVisible();
  await expect(page.getByText("Hours", { exact: true })).toBeVisible();
  await expect(page.getByText("Service area", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Self-employed tax workshop (Tagalog & English)" })).toHaveAttribute(
    "href",
    "/calendar/ev-sample-featured",
  );
  await page.goto("/listing/tax-02");
  await expect(page.getByTestId("owner-story")).toHaveCount(0);
  await expect(page.getByTestId("owner-quote")).toHaveCount(0);
});

test("magazine: 6 SAMPLE stories with the editorial byline; edition articles still listed", async ({ page }) => {
  expect(stories).toHaveLength(6);
  await page.goto("/magazine");
  for (const a of stories) {
    const card = page.locator(`[data-story="${a.slug}"]`);
    await expect(card).toContainText(a.title);
    await expect(card).toContainText("Pinoy Pages Editorial (SAMPLE)");
  }
  await expect(page.getByRole("link", { name: /Do I need to register for HST/ })).toBeVisible();
  await expect(page.locator('a[href="/magazine/ideas"]')).toHaveCount(0);
});

test("sample articles: 300–500 words, byline, links to their sample listings and tools, Get Verified CTA", async ({
  page,
}) => {
  for (const a of stories) {
    const raw = readFileSync(path.join("content", "magazine", `${a.file}.en.md`), "utf8").replace(
      /^---\n[\s\S]*?\n---\n/,
      "",
    );
    const words = raw.split(/\s+/).filter(Boolean).length;
    expect(words, a.slug).toBeGreaterThanOrEqual(300);
    expect(words, a.slug).toBeLessThanOrEqual(500);
    expect(raw, a.slug).not.toMatch(
      /navigate|empower|fast-paced|unlock|journey|seamless|whether you're|in conclusion/i,
    );
    const res = await page.goto(`/magazine/${a.slug}`);
    expect(res?.status()).toBe(200);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(a.title);
    await expect(page.getByTestId("byline")).toContainText("Pinoy Pages Editorial (SAMPLE)");
    const article = page.locator("article");
    for (const id of a.listings) {
      await expect(article.locator(`a[href="/listing/${id}"]`).first(), `${a.slug} → ${id}`).toBeVisible();
      await expect(page.locator(`[data-listing-mention="${id}"]`)).toBeVisible();
    }
    for (const t of a.tools) await expect(page.locator("main").locator(`a[href="${t}"]`).first()).toBeVisible();
    const cta = page.getByTestId("article-cta");
    await expect(cta.getByRole("heading", { name: "Featured in this story? Get Verified" })).toBeVisible();
    await expect(cta.getByRole("link", { name: /Get Verified/ })).toHaveAttribute("href", "/get-verified");
  }
});

test("story ideas: unlisted pipeline of 12 with angle, category, sample business and season", async ({
  page,
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  const ideas = ideasData.ideas;
  expect(ideas).toHaveLength(12);
  await page.goto("/magazine/ideas");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await expect(page.locator("tr[data-idea]")).toHaveCount(12);
  for (const i of ideas) {
    const row = page.locator(`tr[data-idea="${i.id}"]`);
    await expect(row).toContainText(i.title);
    await expect(row).toContainText(i.angle);
    await expect(row).toContainText(/Spring|Summer|Fall/);
    if (i.listing) await expect(row.locator(`a[href="/listing/${i.listing}"]`)).toBeVisible();
    if (i.status === "written") await expect(row.locator(`a[href="/magazine/${i.article}"]`)).toBeVisible();
  }
  expect(ideas.filter((i) => i.status === "written")).toHaveLength(6);
  expect(await (await request.get("/sitemap.xml")).text()).not.toContain("/magazine/ideas");
});

// ---------- Event calendar ----------
const community = guide.events.filter((e) => e.kind === "community");

test("calendar data: ~15 SAMPLE events Nov 2026–Apr 2027, free and featured, incl. the Awards launch", () => {
  expect(community.length).toBeGreaterThanOrEqual(14);
  for (const e of community) {
    expect(e.sample, e.id).toBe(true);
    expect(e.date >= "2026-11-01" && e.date <= "2027-04-30", e.id).toBe(true);
    expect("address" in e && e.address, e.id).toBeTruthy();
  }
  expect(community.some((e) => e.tier === "featured")).toBe(true);
  expect(community.some((e) => e.tier === "free")).toBe(true);
  expect(community.find((e) => e.id === "ev-awards-apr")?.date).toBe("2027-04-16");
});

test("calendar: list and month views, filters by category, city and free/featured; featured first in each month", async ({
  page,
}) => {
  await page.goto("/calendar");
  const list = page.locator("#cal [data-list] [data-ev]");
  await expect(page.getByTestId("event-count")).toHaveText(`${guide.events.length} events`);
  // Featured events sit at the top of their month.
  for (const g of await page.locator("[data-month-group]").all()) {
    const tiers = await g.locator("[data-ev]").evaluateAll((els) => els.map((e) => e.getAttribute("data-event-tier")));
    const firstFree = tiers.indexOf("free");
    if (firstFree >= 0) expect(tiers.slice(firstFree)).not.toContain("featured");
  }
  const controls = page.getByRole("group", { name: "Calendar view and filters" });
  await controls.getByLabel("Listing type").selectOption("featured");
  await expect(list.filter({ visible: true })).toHaveCount(guide.events.filter((e) => e.tier === "featured").length);
  await controls.getByLabel("Listing type").selectOption("");
  await controls.getByLabel("City").selectOption("Markham");
  await expect(list.filter({ visible: true })).toHaveCount(community.filter((e) => e.city === "Markham").length);
  await controls.getByLabel("City").selectOption("");
  await controls.getByLabel("Category").selectOption("insurance");
  await expect(list.filter({ visible: true })).toHaveCount(
    guide.events.filter((e) => "category" in e && e.category === "insurance").length,
  );
  await expect(page).toHaveURL(/cat=insurance/);
  await controls.getByLabel("Category").selectOption("");
  // Month view.
  await controls.getByRole("button", { name: "Month view" }).click();
  await expect(page.getByTestId("month-view")).toBeVisible();
  await expect(page.locator("#cal [data-list]")).toBeHidden();
  await expect(page.getByTestId("month-label")).toHaveText("November 2026");
  const nov = page.locator('[data-month-grid="2026-11"]');
  await expect(nov.getByRole("link", { name: /Kabayan networking night/ })).toBeVisible();
  await controls.getByRole("button", { name: "Next month" }).click();
  await expect(page.getByTestId("month-label")).toHaveText("December 2026");
  await expect(page.locator('[data-month-grid="2026-12"]').getByRole("link", { name: /Simbang Gabi/ })).toBeVisible();
  await expect(page).toHaveURL(/view=month&m=2026-12/);
  // Print mirror (page 11) lists the events too.
  await expect(page.locator("[data-print-mirror]")).toContainText("Pinoy Pages Awards launch");
});

test("event pages: .ics, address + map, host, host listing link only when Verified; featured has image + QR", async ({
  page,
  request,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  for (const e of guide.events) expect((await request.get(`/calendar/${e.id}`)).status(), e.id).toBe(200);
  const ics = await request.get("/ics/ev-sample-featured.ics");
  expect(ics.headers()["content-type"]).toContain("text/calendar");
  const body = await ics.text();
  expect(body).toMatch(/^BEGIN:VCALENDAR\r\n/);
  expect(body).toContain("DTSTART;TZID=America/Toronto:20270227T100000");
  expect(body).toContain("UID:ev-sample-featured@pinoypages.ca");
  expect(body.trim().endsWith("END:VCALENDAR")).toBe(true);
  expect(await (await request.get("/ics/ev-file-2027.ics")).text()).toContain("DTSTART;VALUE=DATE:20270430");
  expect((await request.get("/ics/nope.ics")).status()).toBe(404);

  await page.goto("/calendar/ev-sample-featured");
  await expect(page.getByRole("link", { name: "Add to calendar (.ics)" })).toHaveAttribute(
    "href",
    "/ics/ev-sample-featured.ics",
  );
  await expect(page.getByTestId("event-address")).toContainText("Scarborough, ON");
  await expect(page.getByRole("link", { name: "Directions in Google Maps" })).toHaveAttribute(
    "href",
    /google\.com\/maps/,
  );
  await expect(page.getByTestId("event-host").getByRole("link", { name: "Bituin Tax & Bookkeeping" })).toHaveAttribute(
    "href",
  );
  await expect(page.getByRole("img", { name: /Event image/ })).toBeVisible();
  // Free basic event hosted by a Free (unverified) listing: no host link, no image, no Register.
  await page.goto("/calendar/ev-newcomer-jan");
  await expect(page.getByTestId("event-host")).toContainText("Malaya Community Tax Clinic");
  await expect(page.getByTestId("event-host").getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("img", { name: /Event image|QR code/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Register" })).toHaveCount(0);
});

test("submit your event: zod validation, CASL consent, interest only, tagged event-submitter", async ({ page }) => {
  const email = uniq("event");
  await page.goto("/calendar");
  await page.getByLabel("Event name *").fill("Test info night");
  await page.getByLabel("Date *").fill("2027-02-10");
  await page.getByLabel("Place *").fill("Toronto");
  await page.getByLabel("Organizer *").fill("Test Org");
  await page.getByLabel("Organizer email *").fill(email);
  await page.getByLabel("Event category").selectOption("money");
  await page.getByRole("radio", { name: /Featured event/ }).check();
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await expect(page.getByText("Please agree so we can contact you")).toBeVisible();
  await page.getByLabel("Event name *").fill("Test info night");
  await page.getByLabel("Date *").fill("2027-02-10");
  await page.getByLabel("Place *").fill("Toronto");
  await page.getByLabel("Organizer *").fill("Test Org");
  await page.getByLabel("Organizer email *").fill(email);
  await page.getByRole("radio", { name: /Featured event/ }).check();
  await page.locator('input[name="consent"]').check();
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Thanks" })).toContainText("before anything is charged");
  await expect.poll(() => contactsFor(email).flatMap((c) => c.lists)).toContain("event-submitter");
});

test("upcoming events show on the home page and on sub-category pages", async ({ page }) => {
  await page.goto("/classic");
  await expect(page.getByTestId("upcoming-events").locator("li")).toHaveCount(3);
  await page.goto("/directory/tax-accounting");
  const up = page.getByTestId("upcoming-events");
  await expect(up.getByRole("heading", { name: "Upcoming events · Tax & accounting" })).toBeVisible();
  for (const id of await up.locator("li").evaluateAll((els) => els.map((e) => e.getAttribute("data-event"))))
    expect(["tax-accounting", undefined]).toContain(
      (guide.events.find((e) => e.id === id) as { sub?: string } | undefined)?.sub,
    );
});

// ---------- Marketing the free and paid listings ----------
test("home band, free-card claim links, 'Be the first Verified' prompt and Why Verified with SAMPLE proof", async ({
  page,
}) => {
  test.skip(
    true,
    "Needs the fictional SAMPLE Verified listings removed on alt-design; re-enable with real Verified listings.",
  );
  await page.goto("/classic");
  const band = page.getByTestId("list-band");
  await expect(band.getByRole("link", { name: "List free" })).toHaveAttribute("href", "/list-free");
  await expect(band.getByRole("link", { name: "Get Verified" })).toHaveAttribute("href", "/get-verified");
  await page.goto("/directory/tax-accounting");
  const claim = page.locator('li[data-listing="tax-02"]').getByTestId("free-claim");
  await expect(claim).toContainText("Is this your business?");
  await expect(claim.getByRole("link", { name: "Claim it free" })).toHaveAttribute("href", "/upgrade?listing=tax-02");
  await expect(claim.getByRole("link", { name: "Get Verified" })).toHaveAttribute(
    "href",
    "/get-verified?listing=tax-02",
  );
  const first = page.locator("[data-first-cta]");
  await expect(first).toBeHidden();
  await page.getByRole("search").getByLabel("City").selectOption("North York");
  await expect(first).toBeVisible();
  await expect(first).toContainText("Be the first Verified Tax & accounting business in North York");
  await page.goto("/get-verified");
  const why = page.getByTestId("why-verified");
  await expect(why.getByRole("heading", { name: "Why Verified" })).toBeVisible();
  for (const q of await why.locator("[data-proof]").all()) await expect(q).toContainText("SAMPLE quote");
  await expect(why).toContainText("mutual partner");
  // No fake urgency anywhere on the sales pages.
  for (const path of ["/", "/get-verified", "/list-free"]) {
    await page.goto(path);
    await expect(page.getByText(/only \d+ (spots|left)|limited time|act now|hurry|expires in/i)).toHaveCount(0);
  }
});

test("/list-free: simple form (zod + consent), tags free-lister, optional verified-lead, links up to Verified", async ({
  page,
}) => {
  await page.goto("/list-free");
  await expect(
    page.getByTestId("upsell-verified").getByRole("link", { name: "See how Verified works" }),
  ).toHaveAttribute("href", "/get-verified");
  const form = page.getByRole("form", { name: "List your business free" });
  await form.getByRole("button", { name: "List my business free" }).click();
  await expect(form.getByRole("alert")).toContainText("Please fix");
  const email = uniq("free");
  await form.getByLabel("Your name *").fill("Test Owner");
  await form.getByLabel("Business name *").fill("Test Bakery");
  await form.getByLabel("Email *").fill(email);
  await form.getByLabel("Sub-category *").selectOption("business-services");
  await form.getByLabel("City *").fill("Brampton");
  await form.getByLabel(/Also send me the details on Verified/).check();
  await form.getByLabel(/may contact me about my listing/).check();
  await form.getByRole("button", { name: "List my business free" }).click();
  await expect(form.getByRole("status")).toContainText("details on Verified");
  await expect
    .poll(() => contactsFor(email).flatMap((c) => c.lists))
    .toEqual(expect.arrayContaining(["free-lister", "verified-lead"]));
});

test("sticky Get Verified bar: mobile only, dismissible, never on the ZCard or sign-up pages", async ({
  page,
}, info) => {
  await page.goto("/directory");
  const bar = page.getByTestId("sticky-cta");
  if (info.project.name !== "mobile") {
    await expect(bar).toBeHidden();
    return;
  }
  await expect(bar).toBeVisible();
  await expect(bar.getByRole("link", { name: "Get Verified" })).toHaveAttribute("href", "/get-verified");
  for (const p of ["/card/tax-01", "/get-verified", "/list-free"]) {
    await page.goto(p);
    await expect(page.getByTestId("sticky-cta")).toHaveCount(0);
  }
  await page.goto("/magazine");
  await page.getByTestId("sticky-cta").getByRole("button", { name: "Dismiss" }).click();
  await expect(page.getByTestId("sticky-cta")).toHaveCount(0);
  await page.goto("/directory");
  await expect(page.getByTestId("sticky-cta")).toHaveCount(0);
});

// ---------- alt-design: samples removed ----------
test("alt-design: no fictional sample listings; old sample listing routes 404 cleanly", async ({ page }) => {
  expect(guide.listings.length).toBe(0);
  for (const p of ["/listing/tax-01", "/card/tax-01", "/report/tax-01"]) {
    const res = await page.goto(p);
    expect(res?.status()).toBe(404);
  }
  await page.goto("/directory");
  const html = await page.content();
  for (const n of ["Bituin", "Perlas Bookkeeping", "Araw CPA", "555-01"]) expect(html).not.toContain(n);
});

// ---------- alt-design: alternate home ----------
test("alt home: search + GTA area dropdown, real counts, featured tabs, community events, why, consent signup", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByTestId("alt-home")).toBeVisible();
  await expect(page.getByTestId("confidential-badge")).toHaveText(/confidential draft/i);
  await expect(page.getByTestId("brand-line")).toHaveText(
    "Advertise in Pinoy Pages 2026–2027 · The Filipino Business Directory · GTA",
  );
  const opts = await page.locator("#alt-area option").allInnerTexts();
  expect(opts).toEqual([
    "All GTA",
    "Toronto",
    "Scarborough",
    "North York",
    "Etobicoke",
    "Mississauga",
    "Brampton",
    "Markham",
    "Vaughan",
  ]);
  const pubData = pub.listings as { category: string }[];
  for (const li of await page.getByTestId("alt-categories").locator("li").all()) {
    const href = (await li.locator("a").getAttribute("href"))!;
    const slug = href.includes("category=")
      ? new URL(href, "https://pinoypages.ca").searchParams.get("category")!
      : href.split(/[/#]/).pop()!.replace(/^pub-/, "");
    const n =
      guide.listings.filter((l) => l.category === slug).length + pubData.filter((l) => l.category === slug).length;
    expect(Number(await li.getAttribute("data-count"))).toBe(n);
  }
  const areaTotal = (
    await page
      .getByTestId("alt-areas")
      .locator("li")
      .evaluateAll((els) => els.map((e) => Number(e.getAttribute("data-count"))))
  ).reduce((a, b) => a + b, 0);
  expect(areaTotal).toBe(guide.listings.length + pubData.length);
  await expect(page.getByTestId("public-note")).toContainText("compiled from public information and are not verified");
  // Samples removed: no Verified listings yet, so the badge is explained with a labelled generic example.
  await expect(page.getByTestId("alt-badge-example")).toContainText("Example");
  await expect(page.getByTestId("alt-badge-example")).toContainText("Your business name");
  const html = await page.content();
  for (const n of ["Bituin", "Perlas Bookkeeping", "Hiraya", "Dagat Tax", "555-01", "example.com", "SAMPLE Money"])
    expect(html).not.toContain(n);
  expect(await page.getByTestId("alt-events").locator("li").count()).toBeGreaterThan(0);
  await expect(page.getByTestId("alt-why").locator("li")).toHaveCount(3);
  await expect(page.getByLabel("Monthly member email sign-up")).toBeVisible();
  const text = await page.getByRole("main").innerText();
  expect(text).not.toMatch(/we verify every|\d,\d{3}\+|since 20\d\d|subscribers|Open now/i);
  expect(await page.locator("main img").count()).toBe(0);
  await page.locator("#alt-area").selectOption("Mississauga");
  await page.getByRole("search").getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/\/directory\?.*area=Mississauga/);
});

test("public free listings: GTA only, free + unverified, sourced, name + contact only, no padala/remit", async ({
  page,
}) => {
  const areas = ["Toronto", "Scarborough", "North York", "Etobicoke", "Mississauga", "Brampton", "Markham", "Vaughan"];
  expect(pub.listings.length).toBeGreaterThanOrEqual(140);
  expect(new Set(pub.listings.map((l) => l.id)).size).toBe(pub.listings.length);
  for (const l of pub.listings as Record<string, unknown>[]) {
    expect(areas).toContain(l.area);
    expect(l.tier).toBe("free");
    expect(l.verified).toBe(false);
    expect(String(l.source)).toMatch(/^https?:\/\//);
    expect(l.phone || l.website || l.address || l.email).toBeTruthy();
    expect((pub.categories as { slug: string }[]).map((c) => c.slug)).toContain(l.category);
    for (const k of Object.keys(l))
      expect([
        "listing_id",
        "id",
        "name",
        "category",
        "area",
        "tier",
        "verified",
        "source",
        "address",
        "phone",
        "website",
        "email",
      ]).toContain(k);
  }
  expect(JSON.stringify(pub)).not.toMatch(/remit|padala|money transfer/i);
  await page.goto("/directory");
  const sec = page.getByTestId("public-listings");
  await expect(sec.getByTestId("public-note")).toContainText("Owners can claim, correct or remove a listing");
  await expect(sec.getByTestId("public-note").getByRole("link", { name: "claim" })).toHaveAttribute("href", "/upgrade");
  const pageSize = 48;
  const expectedFirst = Math.min(pageSize, pub.listings.length);
  await expect(sec.locator("li[data-public]")).toHaveCount(expectedFirst);
  await expect(page.getByTestId("directory-range")).toHaveText(`Showing 1–${expectedFirst} of ${pub.listings.length}`);
  await expect(sec.locator("img, [data-badge], [data-testid=zcard-bridge]")).toHaveCount(0);
  await expect(sec).not.toContainText(/Verified Kabayan|Save contact|exa\.ai|totimes/);
  // listing_id stays on each row for analytics
  await expect(sec.locator("li[data-public]").first()).toHaveAttribute("data-listing-id", /.+/);
});

test("directory search and filters cover the free public listings", async ({ page }) => {
  const ls = pub.listings as { name: string; category: string; area: string }[];
  const miss = ls.filter((l) => l.area === "Mississauga");
  const missFood = miss.filter((l) => l.category === "food");
  await page.goto("/directory");
  const search = page.getByRole("search", { name: "Search the directory" });
  await expect(page.getByTestId("search-count")).toHaveText(`${ls.length} businesses found`);
  await search.locator('select[name="area"]').selectOption("Mississauga");
  await search.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/area=Mississauga/);
  await expect(page.getByTestId("search-count")).toHaveText(
    `${miss.length} business${miss.length === 1 ? "" : "es"} found`,
  );
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(miss.length);
  await search.locator('select[name="category"]').selectOption("food");
  await search.getByRole("button", { name: "Search" }).click();
  await expect(page).toHaveURL(/category=food/);
  await expect(page).toHaveURL(/area=Mississauga/);
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(missFood.length);
  await search.getByRole("link", { name: "Clear" }).click();
  await expect(page).toHaveURL(/\/directory\/?$/);
  await expect(page.getByTestId("search-count")).toHaveText(`${ls.length} businesses found`);
  await page.goto("/directory?q=harina");
  await expect(page).toHaveURL(/q=harina/);
  await expect(page).not.toHaveURL(/area=/);
  await expect(page).not.toHaveURL(/category=/);
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(1);
  await expect(page.getByTestId("public-listings").locator("li[data-public]").first()).toContainText(
    "Harina Bakeshoppe",
  );
  await page.goto("/directory?q=wilson%20ave");
  expect(await page.getByTestId("public-listings").locator("li[data-public]").count()).toBeGreaterThan(5);
  await expect(page.getByTestId("search-count")).toContainText("found");
  await page.goto("/directory?q=zzz-nothing-here");
  await expect(page.getByTestId("directory-empty")).toBeVisible();
  await expect(page.getByTestId("search-count")).toContainText("No businesses match");
});

test("directory pagination: page size, page 2 link, filter combos keep page in URL", async ({ page }) => {
  const total = pub.listings.length;
  const pageSize = 48;
  const totalPages = Math.ceil(total / pageSize);
  expect(totalPages).toBeGreaterThan(1);
  await page.goto("/directory");
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(pageSize);
  await expect(page.getByTestId("directory-range")).toHaveText(`Showing 1–${pageSize} of ${total}`);
  const nav = page.getByTestId("directory-pagination");
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("link", { name: "Next page, page 2" })).toHaveAttribute("href", "/directory?page=2");
  await expect(nav.getByRole("link", { name: "Go to page 2" })).toHaveAttribute("href", "/directory?page=2");
  await nav.getByRole("link", { name: "Go to page 2" }).click();
  await expect(page).toHaveURL(/\/directory\?page=2/);
  const remaining = total - pageSize;
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(
    Math.min(pageSize, remaining),
  );
  await expect(page.getByTestId("directory-range")).toHaveText(
    `Showing ${pageSize + 1}–${pageSize + Math.min(pageSize, remaining)} of ${total}`,
  );
  // Filter combo: category + area, shareable URL, no pagination when under page size
  await page.goto("/directory?category=food&area=Mississauga");
  const missFood = (pub.listings as { category: string; area: string }[]).filter(
    (l) => l.category === "food" && l.area === "Mississauga",
  );
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(missFood.length);
  await expect(page.getByTestId("directory-pagination")).toHaveCount(0);
  // Legacy city/sub aliases still work
  await page.goto("/directory?city=Scarborough&sub=food");
  const scarFood = (pub.listings as { category: string; area: string }[]).filter(
    (l) => l.category === "food" && l.area === "Scarborough",
  );
  await expect(page.getByTestId("public-listings").locator("li[data-public]")).toHaveCount(scarFood.length);
});

test("/advertise shows four print sizes with dimensions, rates on request, specs and TBA deadlines", async ({
  page,
}) => {
  await page.goto("/advertise");
  await expect(page.getByRole("heading", { name: /Advertise in Pinoy Pages 2026–2027/ })).toBeVisible();
  const sizes = page.getByTestId("ad-sizes").locator(":scope > li");
  await expect(sizes).toHaveCount(4);
  for (const [id, name, dim] of <[string, string, string][]>[
    ["full", "Full page", "8.5″ × 11″"],
    ["half", "Half page", "7.5″ × 4.875″"],
    ["quarter", "Quarter page", "3.625″ × 4.875″"],
    ["card", "Business card", "3.5″ × 2″"],
  ]) {
    const card = page.locator(`[data-size="${id}"]`);
    await expect(card.getByRole("heading", { name })).toBeVisible();
    await expect(card).toContainText(dim);
    await expect(card.getByTestId("rate")).toHaveText("Rates on request");
    await expect(page.getByTestId(`diagram-${id}`)).toBeVisible();
  }
  await expect(page.locator("main")).not.toContainText(/\$\d+ per (ad|page)|April 2027 edition \(preview\)/);
  await expect(page.getByTestId("artwork-specs")).toContainText("300 dpi");
  await expect(page.getByTestId("artwork-specs")).toContainText("CMYK");
  await expect(page.getByTestId("artwork-specs")).toContainText("PDF/X");
  await expect(page.getByTestId("artwork-specs")).toContainText("bleed");
  await expect(page.getByTestId("deadlines")).toContainText("to be announced");
  await expect(page.getByRole("link", { name: "info@pinoypages.ca" }).first()).toHaveAttribute(
    "href",
    /^mailto:info@pinoypages\.ca/,
  );
  await expect(page.locator('input[type="password"], input[autocomplete^="cc-"]')).toHaveCount(0);
});

test("ad enquiry: size preselected from link, consent required, all four sizes accepted", async ({ page }) => {
  await page.goto("/advertise?size=quarter");
  const sel = page.getByLabel(/interested in/);
  await expect(sel).toHaveValue("ad-quarter");
  for (const v of ["ad-full", "ad-half", "ad-quarter", "ad-card", "verified"])
    await expect(sel.locator(`option[value="${v}"]`)).toHaveCount(1);
  await page.getByRole("button", { name: "Send ad enquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await expect(page.getByText("Please agree so we can contact you")).toBeVisible();
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Phone").fill("416-555-0100");
  await page.getByLabel(/interested in/).selectOption("ad-card");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send ad enquiry" }).click();
  await expect(page.getByRole("status").first()).toContainText("We received your request");
});

test("home leads with advertising; directory stays as proof", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("brand-line")).toContainText(
    "Advertise in Pinoy Pages 2026–2027 · The Filipino Business Directory · GTA",
  );
  await expect(page.getByTestId("hero-ad-cta").getByRole("link", { name: "See ad sizes" })).toHaveAttribute(
    "href",
    "/advertise",
  );
  await expect(page.getByTestId("home-ad-sizes").locator("li")).toHaveCount(4);
  await expect(page.getByRole("search", { name: "Find a business" })).toBeVisible();
  await expect(page.locator("header").getByRole("link", { name: "Book an ad" })).toBeVisible();
});
