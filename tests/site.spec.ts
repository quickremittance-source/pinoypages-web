import { test, expect, type Page } from "@playwright/test";
import { createHmac } from "node:crypto";
import { TEST_ENV } from "../playwright.config";
import AxeBuilder from "@axe-core/playwright";
import guide from "../content/guide.json";
import jsQR from "jsqr";
import { PNG } from "pngjs";

const routes = [...new Set(guide.pages.map((p) => p.route))].concat([
  "/directory",
  "/edition",
  "/magazine",
  "/magazine/do-i-need-hst",
  "/magazine/do-i-need-hst/tl",
  "/calendar",
  "/upgrade",
  "/privacy",
  "/terms",
  "/listing/tax-02",
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

test("all ad slots (11 + calendar sponsor) from the shared data render on the site", async ({ page }) => {
  let count = 0;
  for (const r of [...new Set(guide.pages.filter((p) => p.ad).map((p) => p.route))]) {
    await page.goto(r);
    count += await page.locator('aside[aria-label^="Ad space"], aside[aria-label^="Advertisement"]').count();
  }
  expect(count).toBe(guide.ads.length);
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
  await page.goto("/directory/tax-accounting");
  await page
    .getByRole("link", { name: /Claim or upgrade/ })
    .first()
    .click();
  await expect(page).toHaveURL(/\/upgrade\?listing=/);
  await expect(page.getByText("Claiming:")).toBeVisible();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Featured").check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
});

test("ad inquiry form validates then succeeds", async ({ page }) => {
  await page.goto("/advertise?slot=slot-03");
  await expect(page.getByRole("heading", { name: /space slot-03/ })).toBeVisible();
  await page.getByRole("button", { name: "Send inquiry" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toContainText("Please fix");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel(/interested in/).selectOption("full");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Send inquiry" }).click();
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
  expect(paid.length).toBeGreaterThan(0);
  for (const l of paid) {
    const png = await request.get(`/qr/${l.id}/qr.png`);
    expect(png.headers()["content-type"]).toBe("image/png");
    expect(decode(await png.body())).toBe(`${site}/go/${l.id}`);
    expect(await (await request.get(`/qr/${l.id}/qr.svg`)).text()).toContain("Find us on");
    const pdf = await request.get(`/qr/${l.id}/qr.pdf`);
    expect((await pdf.body()).subarray(0, 5).toString()).toBe("%PDF-");
  }
  for (const l of free) {
    for (const f of ["qr.png", "qr.svg", "qr.pdf", "basic.png"])
      expect((await request.get(`/qr/${l.id}/${f}`)).status()).toBe(404);
    expect((await request.get(`/go/${l.id}`, { maxRedirects: 0 })).status()).toBe(404);
    expect((await request.get(`/vcard/${l.id}.vcf`)).status()).toBe(404);
  }
});

test("/go/ counted link redirects paid listings with UTM", async ({ request }) => {
  const res = await request.get("/go/ind-01", { maxRedirects: 0 });
  expect(res.status()).toBe(307);
  expect(res.headers()["location"]).toMatch(
    /\/listing\/ind-01\?utm_source=own-qr&utm_medium=qr&utm_campaign=lister&utm_content=ind-01$/,
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

test("free listing page = name + contact only: no QR, no vCard, no photos", async ({ page }) => {
  await page.goto("/listing/tax-02");
  await expect(page.getByText("905-555-0102")).toBeVisible();
  await expect(page.getByRole("img", { name: /QR code/ })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Save contact" })).toHaveCount(0);
  await expect(page.getByLabel("Photos")).toHaveCount(0);
  await expect(page.getByText("Languages")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Upgrade to Featured" })).toBeVisible();
});

test("Starter page: Verified, Save contact and QR; Featured adds Call / Book and photos", async ({ page }) => {
  await page.goto("/listing/ind-01");
  await expect(page.getByText("✓ Verified").first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Save contact" })).toHaveAttribute("href", "/vcard/ind-01.vcf");
  await expect(page.getByRole("img", { name: /QR code for/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Call / Book" })).toHaveCount(0);
  await page.goto("/listing/tax-01");
  await expect(page.getByRole("link", { name: "Call / Book" })).toHaveAttribute("href", "/go/tax-01?via=call");
  await expect(page.getByLabel("Photos")).toBeVisible();
  await expect(page.getByRole("link", { name: "Print-ready label (PDF)" })).toBeVisible();
});

test("directory: free entries are one line; featured shows tagline", async ({ page }) => {
  await page.goto("/directory/tax-accounting");
  await expect(page.locator('li[data-tier="free"]').first()).not.toContainText("Tagalog");
  await expect(page.locator('li[data-tier="featured"]')).toContainText("Personal & self-employed returns");
});

test("sold ad mirrors online with corner QR and tap-to-open button", async ({ page }) => {
  await page.goto("/magazine");
  const ad = page.getByRole("complementary", { name: /Advertisement: Sample Tax Preparer 01/ });
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
  // Starter has no Call / Book; free listings have no counted links at all.
  expect((await request.get("/go/ind-01?via=call", { maxRedirects: 0 })).status()).toBe(404);
  expect((await request.get("/go/tax-02?via=map", { maxRedirects: 0 })).status()).toBe(404);
});

test("analytics: listing page views are counted (free listings too); bots and bad input are not", async ({
  page,
  request,
}) => {
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
  expect(s).toContain("Sample Tax Preparer 01: your Pinoy Pages counts for November 2026");
  expect(s).toContain("not a promise of future results");
  expect(s).not.toContain("Sample CPA Office 02"); // free listing: counted, never emailed
});

test("Money & Business Calendar: CRA deadlines, free vs featured events, sponsor slot, prices in config", async ({
  page,
  request,
}) => {
  const price = Object.fromEntries(guide.eventMenu.map((o) => [o.id, [o.price, o.founding]]));
  expect(price).toEqual({ "event-free": [0, 0], "event-featured": [49, 49], "calendar-sponsor": [450, 360] });
  expect(guide.pages.find((p) => p.page === 11)).toMatchObject({ route: "/calendar", ad: "slot-cal" });
  for (const e of guide.events.filter((x) => x.kind === "deadline"))
    expect(e.source).toMatch(/^https:\/\/www\.canada\.ca\//);
  await page.goto("/calendar");
  await expect(page.locator('[data-kind="deadline"]')).toHaveCount(
    guide.events.filter((x) => x.kind === "deadline").length,
  );
  const free = page.locator('[data-event-tier="free"][data-kind="community"]');
  await expect(free.getByRole("link")).toHaveCount(0); // name, date, place, organizer contact only
  await expect(free.locator("img, svg")).toHaveCount(0);
  await expect(page.locator('[data-event-tier="featured"]').getByRole("link", { name: "Register" })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "Ad space slot-cal" })).toBeVisible();
  expect((await request.get("/e/ev-sample-free", { maxRedirects: 0 })).status()).toBe(404);
  const before = await count(page, "tax-01", "website"); // sanity: admin reachable
  expect(before).toBeGreaterThanOrEqual(0);
  const r = await request.get("/e/ev-sample-featured", { maxRedirects: 0 });
  expect(r.status()).toBe(307);
  expect(r.headers().location).toBe("https://example.com/register");
  await page.goto("/calendar/ev-sample-featured");
  await expect(page.getByRole("img", { name: /QR code to register/ })).toBeVisible();
  expect((await request.get("/calendar/ev-sample-free")).status()).toBe(404);
});

test("event submission validates then succeeds (member featured event is free)", async ({ page }) => {
  await page.goto("/calendar");
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Please fix" })).toBeVisible();
  await page.getByLabel("Event name *").fill("Test workshop");
  await page.getByLabel("Date *").fill("2027-03-10");
  await page.getByLabel("Place *").fill("Toronto");
  await page.getByLabel("Organizer *").fill("Test Org");
  await page.getByLabel("Organizer email *").fill("org@example.com");
  await page.getByLabel(/Featured event/).check();
  await page.getByLabel("Member? Choose your paid listing").selectOption("ind-01");
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Submit event" }).click();
  await expect(page.getByRole("status").first()).toContainText("As a member your featured event is free");
});

test("public menu = 3 choices (Free, Featured, Ad); Starter QR + events are add-ons; prices from config", async ({
  page,
}) => {
  const main = guide.adMenu.filter((a) => a.menu === "main").map((a) => a.id);
  expect(main).toEqual(["free", "featured", "half", "full"]);
  expect(guide.adMenu.filter((a) => a.menu === "addon").map((a) => a.id)).toEqual(["starter"]);
  const price = Object.fromEntries(guide.adMenu.map((a) => [a.id, [a.price, a.founding]]));
  expect(price).toEqual({ free: [0, 0], starter: [99, 79], featured: [390, 299], half: [450, 360], full: [850, 690] });
  expect(JSON.stringify(guide.adMenu)).not.toMatch(/lead/i);
  for (const o of guide.adMenu.filter((x) => x.price > 0)) expect(o.unit).toMatch(/12-month listing/);
  expect(JSON.stringify(guide)).not.toMatch(/yearbook|guarantee(d)? (leads|results|calls)|results report/i);
  for (const path of ["/upgrade", "/advertise"]) {
    await page.goto(path);
    await expect(
      page.getByText(/Pinoy Pages 2026–2027 · Spring · Summer · Fall · Annual edition/).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/The website is the product. Print is the proof copy \(100 copies\)/).first(),
    ).toBeVisible();
    await expect(page.getByRole("row", { name: /Starter/ })).toHaveCount(0);
    await expect(page.getByTestId("addons")).toContainText("Starter QR $99 ($79 founding)");
    await expect(page.getByTestId("addons")).toContainText("Featured event $49, free for paying members");
    await expect(page.getByTestId("addons")).toContainText("Calendar sponsor $450 ($360 founding)");
    await expect(page.getByText(/Invitation-only extras/)).toContainText("$1,950");
    await expect(page.getByText(/Founding price locked:/).first()).toBeVisible();
    await expect(page.getByText(/Member renewal discount|\$239/)).toHaveCount(0);
    await expect(page.getByText(/pay-per-lead|per lead/i)).toHaveCount(0);
  }
  await page.goto("/upgrade");
  await expect(page.getByText(guide.brand.pitch)).toBeVisible();
  await expect(page.getByText("Print page 19")).toBeVisible();
  expect(guide.pages.find((p) => p.page === 19)).toMatchObject({ route: "/upgrade" });
  await page.goto("/upgrade?listing=tax-03");
  await page.getByLabel("Your name *").fill("Test Person");
  await page.getByLabel("Business name *").fill("Test Business");
  await page.getByLabel("Email *").fill("test@example.com");
  await page.getByLabel("Featured", { exact: true }).check();
  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: "Claim my listing" }).click();
  await expect(page.getByRole("status").first()).toContainText("verify your listing");
  await page.goto("/terms");
  await expect(page.getByText(/Founding price lock \(firm rule\)/)).toBeVisible();
  await expect(page.getByText(/flat 20% off their locked price/)).toBeVisible();
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
  for (const s of ["spring", "summer", "fall"]) await expect(page.locator(`[data-season="${s}"]`)).toBeVisible();
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
