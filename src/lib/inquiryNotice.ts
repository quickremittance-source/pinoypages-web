/** Inquiry notification settings (no server-only import so tests can load it). */
export const NOTIFY_TO = "pinoypagesca@gmail.com";
export const SENDER = { name: "PinoyPages", email: "info@pinoypages.ca" } as const;
/** Default OFF. Only the exact string "true" enables the single Brevo notification path. */
export const notifyEnabled = (env: Record<string, string | undefined> = process.env) =>
  env.INQUIRY_NOTIFY_ENABLED === "true";
