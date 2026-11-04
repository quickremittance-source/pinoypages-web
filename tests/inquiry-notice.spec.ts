import { test, expect } from "@playwright/test";
import { readFileSync, existsSync } from "node:fs";
import { NOTIFY_TO, SENDER, notifyEnabled } from "../src/lib/inquiryNotice";

test.describe("inquiry notification (unit)", () => {
  test("defaults OFF; only exact 'true' enables", () => {
    expect(notifyEnabled({})).toBe(false);
    for (const v of ["", "false", "1", "yes", "TRUE"]) expect(notifyEnabled({ INQUIRY_NOTIFY_ENABLED: v })).toBe(false);
    expect(notifyEnabled({ INQUIRY_NOTIFY_ENABLED: "true" })).toBe(true);
  });
  test("sender is info@pinoypages.ca; recipient is the owner inbox only", () => {
    expect(SENDER).toEqual({ name: "PinoyPages", email: "info@pinoypages.ca" });
    expect(NOTIFY_TO).toBe("pinoypagesca@gmail.com");
  });
  test("one path only: no Sheet mirror or Apps Script", () => {
    const src = readFileSync("src/lib/inquiries.ts", "utf8");
    expect(src).not.toMatch(/SHEETS_WEBHOOK|mirrorToSheet|INQUIRY_SENDER_EMAIL/);
    expect(src).toMatch(/if \(!notifyEnabled\(\)\) return false;/);
    expect(existsSync("scripts/apps-script/inquiries-sheet.gs")).toBe(false);
  });
});
