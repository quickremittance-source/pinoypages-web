import { expect, test } from "@playwright/test";

test("menu highlights the current page (exact and nested)", async ({ page, isMobile }) => {
  const nav = () => page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
  await page.goto("/directory");
  await expect(nav().locator('[aria-current="page"]')).toHaveText("Directory");
  await page.goto("/magazine");
  await expect(nav().locator('[aria-current="page"]')).toHaveText("Magazine");
  await expect(nav().getByTestId("nav-home")).not.toHaveAttribute("aria-current", "page");
  await page.goto("/");
  await expect(nav().locator('[aria-current="page"]')).toHaveCount(1);
  await expect(nav().getByRole("link", { name: "Home", exact: true })).toHaveAttribute("aria-current", "page");
  const tools = await page.request.get("/tools/hst-checker", { maxRedirects: 0 });
  expect(tools.status()).toBe(308);
  expect(tools.headers().location).toContain("/magazine");
});

test("deadlines merged into the calendar: labels, type filter, redirect", async ({ page, request }) => {
  const r = await request.get("/tax-deadlines", { maxRedirects: 0 });
  expect(r.status()).toBe(308);
  expect(r.headers().location).toContain("/calendar?type=deadline");
  await page.goto("/calendar");
  await expect(page.getByTestId("type-label").filter({ hasText: "Tax deadline" }).first()).toBeVisible();
  await expect(page.locator("#tax-checklist")).toBeVisible();
  await page.goto("/calendar?type=deadline");
  await expect(page.getByTestId("type-filter")).toHaveValue("deadline");
  const shown = page.locator("[data-list] [data-ev]:not([hidden])");
  expect(await shown.count()).toBeGreaterThan(0);
  for (const t of await shown.evaluateAll((els) => els.map((e) => e.getAttribute("data-type"))))
    expect(t).toBe("deadline");
});

test("Home icon then Directory lead the menu; Advertise is one item active on both pages", async ({ page, isMobile }) => {
  for (const path of ["/advertise", "/get-verified"]) {
    await page.goto(path);
    const main = page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
    await expect(main.getByRole("link").first()).toHaveAttribute("aria-label", "Home");
    await expect(main.getByRole("link").nth(1)).toHaveText("Directory");
    const item = main.getByRole("link", { name: "Advertise", exact: true });
    await expect(item).toHaveAttribute("href", "/advertise");
    await expect(item).toHaveAttribute("aria-current", "page");
    await expect(main.getByRole("link", { name: "Get Verified", exact: true })).toHaveCount(0);
    const tabs = page.getByTestId("adv-tabs");
    await expect(tabs.getByRole("link", { name: "Get Verified" })).toHaveAttribute("href", "/get-verified");
    await expect(tabs.locator('[aria-current="page"]')).toHaveAttribute("href", path);
  }
});

test("directory shows category counts broken down by area", async ({ page }) => {
  await page.goto("/directory");
  const box = page.getByTestId("cat-area-counts");
  const food = box.locator('[data-cat="food"]');
  await expect(food).toContainText(/Food.*\(\d+\)/);
  await expect(food.locator("[data-cat-area]").first()).toHaveAttribute("href", /category=food&area=/);
  await expect(box.locator("[data-area]").first()).toHaveAttribute("href", /area=/);
});

test("/api/revalidate: 404 without a valid key header, GET is 404", async ({ request }) => {
  expect((await request.post("/api/revalidate")).status()).toBe(404);
  expect((await request.post("/api/revalidate", { headers: { "x-admin-key": "wrong" } })).status()).toBe(404);
  expect((await request.get("/api/revalidate")).status()).toBe(404);
});

test("Magazine menu holds Events & deadlines; top level is Home, Directory, Advertise, Magazine", async ({
  page,
  isMobile,
}) => {
  const nav = () => page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
  await page.goto("/");
  const top = nav().locator(":scope > ul > li > a, :scope > ul > li > span > a");
  await expect(top).toHaveText(["", "Directory", "Advertise", "Magazine"]);
  await expect(top.first()).toHaveAttribute("aria-label", "Home");
  for (const p of ["/magazine", "/calendar"]) {
    await page.goto(p);
    await expect(nav().getByRole("link", { name: "Magazine", exact: true })).toHaveAttribute("data-active", "true");
  }
  if (!isMobile) {
    const btn = nav().getByRole("button", { name: "Magazine submenu" });
    await expect(page.getByTestId("submenu")).toBeHidden();
    await btn.focus();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    await expect(page.getByTestId("submenu").getByRole("link", { name: "Events & deadlines" })).toBeVisible();
    await expect(page.getByTestId("submenu").getByRole("link", { name: "Tools" })).toHaveCount(0);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("submenu")).toBeHidden();
    await page.getByRole("link", { name: "Magazine", exact: true }).hover();
    await expect(page.getByTestId("submenu").getByRole("link", { name: "Events & deadlines" })).toBeVisible();
    await expect(page.getByTestId("submenu").getByRole("link", { name: "Tools" })).toHaveCount(0);
  } else {
    await expect(nav().getByRole("link", { name: "Events & deadlines" })).toHaveAttribute("href", "/calendar");
    await expect(nav().getByRole("link", { name: "Tools" })).toHaveCount(0);
  }
});

test("/advertise explains advertise, get Verified, or both", async ({ page }) => {
  await page.goto("/advertise");
  const w = page.getByTestId("ways");
  await expect(w).toContainText("$199 per issue");
  await expect(w).toContainText("never bought");
  await expect(w).not.toContainText(/year|HST/i);
  await expect(w.getByRole("link", { name: "Get Verified" })).toHaveAttribute("href", "/get-verified");
});

test("migration splitter handles trailing comments and quotes", async () => {
  const { splitSql } = await import("../scripts/sql-split.mjs");
  expect(splitSql("alter table a add x int; -- note; here\nselect '--;x';\n-- only\n")).toEqual([
    "alter table a add x int",
    "select '--;x'",
  ]);
});

test("/go, /card and /vcard 404 for unknown or free listings", async ({ request }) => {
  for (const p of ["/go/nope", "/card/nope", "/vcard/nope.vcf"])
    expect((await request.get(p, { maxRedirects: 0 })).status()).toBe(404);
});

test("category tiles show a section count from public listings", async ({ page }) => {
  await page.goto("/directory");
  await expect(page.getByTestId("section-count").first()).toContainText(/\d+ listings · \d+ verified/);
});

test("migration splitter: statements followed by '; --' comments split correctly", async () => {
  const { splitSql } = await import("../scripts/sql-split.mjs");
  const src = [
    "alter table listings add column if not exists locked boolean; -- sync lock",
    "alter table ads add column if not exists end_date date;   -- ends; inclusive",
    "create table t (a text default 'x;--y'); -- quoted ; and -- kept",
    "create function f() returns int as $$ select 1; -- inside body\n $$ language sql; -- after",
    "-- trailing comment only",
  ].join("\n");
  const out = splitSql(src);
  expect(out).toHaveLength(4);
  expect(out[0]).toBe("alter table listings add column if not exists locked boolean");
  expect(out[1]).toBe("alter table ads add column if not exists end_date date");
  expect(out[2]).toBe("create table t (a text default 'x;--y')");
  expect(out[3]).toContain("$$ select 1; -- inside body\n $$ language sql");
  for (const s of out) expect(s.trim().startsWith("--")).toBe(false);
});

test("ZCard from Neon: email and languages when present, omitted (not invented) when missing", async () => {
  const { parseLanguages } = await import("../src/lib/cardParse");
  expect(parseLanguages(["Tagalog", "English", 3, " "])).toBe("Tagalog, English");
  expect(parseLanguages("Ilocano")).toBe("Ilocano");
  expect(parseLanguages(null)).toBeUndefined();
  expect(parseLanguages({})).toBeUndefined();
});

test("home icon is the first main-nav item and links to /", async ({ page, isMobile }) => {
  await page.goto("/directory");
  const nav = page.getByRole("navigation", { name: isMobile ? "Main (mobile)" : "Main", exact: true });
  const first = nav.locator("li > a").first();
  await expect(first).toHaveAttribute("aria-label", "Home");
  await expect(first).toHaveAttribute("href", "/");
  await first.click();
  await expect(page).toHaveURL(/\/$/);
});

test("brand assets, manifest and Platito removed from fallback", async ({ request }) => {
  for (const f of [
    "/brand/icon-badge-verified-kabayan.png",
    "/brand/icon-sun.png",
    "/brand/icons/icon-home.svg",
    "/brand/pinoypages-logo-stacked-jovi.png",
  ])
    expect((await request.get(f)).status(), f).toBe(200);
  const m = await (await request.get("/manifest.webmanifest")).json();
  expect(m.theme_color).toBe("#002050");
  const r = await request.get("/directory?q=platito");
  expect(await r.text()).not.toContain("brevo-platito-filipino-soul-food");
});
