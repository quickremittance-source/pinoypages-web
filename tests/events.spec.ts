import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import eventsFile from "../content/events.json";
import {
  approvedEvents,
  communityEventIcs,
  eventJsonLd,
  filterEvents,
  googleCalendarUrl,
  mapsUrl,
  needsOrganizerConfirm,
  parseEventFilters,
  type CommunityEvent,
} from "../src/lib/events";

/** Extra fixtures for pure lib tests — never written to content/events.json. */
const FIXTURES: CommunityEvent[] = [
  {
    id: "evt-test-fiesta",
    slug: "test-fiesta-gta",
    title: "Test Fiesta",
    start: "2026-12-01T18:00:00",
    end: "2026-12-01T21:00:00",
    timezone: "America/Toronto",
    city: "GTA",
    category: "fiesta",
    venue: "Test Hall",
    address: "100 Test St, Toronto, ON",
    description: "Fixture only.",
    ticketUrl: "https://example.com/tickets",
    listingId: "pub-sampaguita-village-family-restaurant",
    sourceUrl: "https://example.com/source",
    sourceConfidence: "confirmed",
    status: "approved",
  },
  {
    id: "evt-test-recurring",
    slug: "test-recurring",
    title: "Recurring Mass",
    start: "2026-12-10T14:00:00",
    end: "2026-12-10T15:00:00",
    timezone: "America/Edmonton",
    city: "Edmonton",
    category: "church",
    venue: "Parish",
    sourceUrl: "https://example.com/mass",
    sourceConfidence: "recurring",
    status: "approved",
  },
];

test("content/events.json has approved real events with sources (no unsourced)", () => {
  expect(eventsFile.events.length).toBeGreaterThanOrEqual(1);
  for (const e of eventsFile.events) {
    expect(e.status).toBe("approved");
    expect(e.sourceUrl, e.title).toBeTruthy();
    expect(String(e.sourceUrl)).toMatch(/^https?:\/\//);
  }
  // Every published event is loadable via the library
  expect(approvedEvents().length).toBe(eventsFile.events.length);
});

test("/events lists real events and passes axe", async ({ page }) => {
  const res = await page.goto("/events");
  expect(res?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/Filipino community events/i);
  await expect(page.getByTestId("events-count")).toContainText(/\d+ events?/);
  await expect(page.getByTestId("community-event-form")).toBeVisible();
  // First approved event title should appear
  const first = approvedEvents()
    .slice()
    .sort((a, b) => a.start.localeCompare(b.start))[0]!;
  await expect(page.getByRole("link", { name: first.title }).first()).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test("/events filters via query params (server-side)", async ({ page }) => {
  await page.goto("/events?city=GTA&view=month&month=2026-12");
  await expect(page).toHaveURL(/city=GTA/);
  await expect(page.getByRole("heading", { name: /December 2026/i })).toBeVisible();
  await expect(page.getByTestId("events-count")).toBeVisible();
});

test("event detail shows Source and expected badge when needed", async ({ page }) => {
  const withBadge = approvedEvents().find(needsOrganizerConfirm);
  const confirmed = approvedEvents().find((e) => e.sourceConfidence === "confirmed" && e.sourceUrl);
  expect(withBadge).toBeTruthy();
  expect(confirmed).toBeTruthy();

  await page.goto(`/events/${withBadge!.slug}`);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(withBadge!.title);
  await expect(page.getByTestId("expected-badge")).toContainText(/Expected, confirm with organizer/);
  await expect(page.getByTestId("event-source")).toContainText("Source:");
  await expect(page.getByTestId("event-source").locator("a")).toHaveAttribute("href", withBadge!.sourceUrl!);

  await page.goto(`/events/${confirmed!.slug}`);
  await expect(page.getByTestId("event-source").locator("a")).toHaveAttribute("href", confirmed!.sourceUrl!);
  await expect(page.getByTestId("expected-badge")).toHaveCount(0);

  const ics = await page.request.get(`/events/ics/${confirmed!.slug}`);
  expect(ics.status()).toBe(200);
  expect(await ics.headers()["content-type"]).toMatch(/text\/calendar/);
  expect(await ics.text()).toContain("BEGIN:VEVENT");
});

test("unknown event slug 404s; ics for unknown slug 404s", async ({ page, request }) => {
  const res = await page.goto("/events/does-not-exist");
  expect(res?.status()).toBe(404);
  const ics = await request.get("/events/ics/does-not-exist");
  expect(ics.status()).toBe(404);
});

test("submit form honeypot short-circuits; valid submit succeeds", async ({ page }) => {
  await page.goto("/events");
  const form = page.getByTestId("community-event-form");
  await expect(form).toBeVisible();
  await form.locator('input[name="website_url"]').evaluate((el: HTMLInputElement) => {
    el.value = "https://spam.example";
  });
  await form.locator('input[name="title"]').fill("Spam");
  await form.locator('button[type="submit"]').click();
  await expect(form.getByRole("status")).toContainText(/Thanks/i);

  await page.goto("/events");
  const form2 = page.getByTestId("community-event-form");
  await form2.locator('input[name="title"]').fill("Kabayan Night");
  await form2.locator('input[name="start"]').fill("2026-11-15T18:00");
  await form2.locator('input[name="end"]').fill("2026-11-15T21:00");
  await form2.locator('select[name="city"]').selectOption("GTA");
  await form2.locator('select[name="category"]').selectOption("community");
  await form2.locator('input[name="venue"]').fill("Community Hall");
  await form2.locator('input[name="organizer"]').fill("Jose Test");
  await form2.locator('input[name="email"]').fill("organizer@example.com");
  await form2.locator('input[name="consent"]').check();
  await form2.locator('button[type="submit"]').click();
  await expect(form2.getByRole("status")).toContainText(/Salamat|received your event/i);
});

test("lib: filter fixtures; badge helper; ics and json-ld", () => {
  expect(filterEvents(FIXTURES, { city: "GTA", category: "" })).toHaveLength(1);
  expect(needsOrganizerConfirm(FIXTURES[1]!)).toBe(true);
  expect(needsOrganizerConfirm(FIXTURES[0]!)).toBe(false);
  const f = parseEventFilters({ city: "GTA", view: "month", month: "2026-12" });
  expect(f.view).toBe("month");
  const e = FIXTURES[0]!;
  expect(communityEventIcs(e, "20261027T120000Z")).toContain("SUMMARY:Test Fiesta");
  expect(googleCalendarUrl(e)).toContain("calendar.google.com");
  expect(mapsUrl(e)).toContain("google.com/maps");
  expect(eventJsonLd(e)["@type"]).toBe("Event");
});

test("Events nav link present", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('header a[href="/events"]:visible').first()).toBeVisible();
});
