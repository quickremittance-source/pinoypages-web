/**
 * OPTIONAL (off by default; site emails via Brevo). Pinoy Pages Inquiries: Google Apps Script web app bound to the private "Pinoy Pages Inquiries" sheet.
 * Setup (owner only): Extensions > Apps Script, paste this file, Project Settings > Script properties:
 *   WEBHOOK_SECRET = <same random value as Vercel SHEETS_WEBHOOK_SECRET>
 *   NOTIFY_EMAIL   = pinoypagesca@gmail.com
 * Deploy > New deployment > Web app, Execute as: Me, Who has access: Anyone (the secret guards it).
 * Put the /exec URL in Vercel as SHEETS_WEBHOOK_URL. Never commit the secret.
 * One tab per form kind; Status/Response columns are for Jose. Notification goes ONLY to NOTIFY_EMAIL.
 */
var HEADERS = ["Neon ID", "Submitted", "Name", "Business", "Email", "Phone", "Listing", "Product/Plan", "Details", "Status", "Response", "Responded"];

function doPost(e) {
  var props = PropertiesService.getScriptProperties();
  var body = JSON.parse(e.postData.contents || "{}");
  if (!body.secret || body.secret !== props.getProperty("WEBHOOK_SECRET")) {
    return ContentService.createTextOutput("forbidden");
  }
  var kind = String(body.kind || "other").replace(/[^\w-]/g, "").slice(0, 40);
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(kind) || ss.insertSheet(kind);
  if (sh.getLastRow() === 0) { sh.appendRow(HEADERS); sh.setFrozenRows(1); }
  var d = body.data || {};
  var details = Object.keys(d).filter(function (k) { return ["email", "name", "phone", "consent", "website_url"].indexOf(k) < 0; })
    .map(function (k) { return k + ": " + d[k]; }).join("\n");
  sh.appendRow([body.id || "", body.submittedAt, body.name || "", body.business || "", body.email || "", body.phone || "",
    body.listing || "", body.product || "", details, "new", "", ""]);
  var to = props.getProperty("NOTIFY_EMAIL");
  if (to) {
    MailApp.sendEmail(to, "New Pinoy Pages " + kind + ": " + (body.business || body.name || body.email),
      "Name: " + (body.name || "") + "\nBusiness: " + (body.business || "") + "\nEmail: " + (body.email || "") +
      "\nPhone: " + (body.phone || "") + "\n\n" + details + "\n\nSheet: " + ss.getUrl());
  }
  return ContentService.createTextOutput("ok");
}
