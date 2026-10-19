import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import data from "../../content/guide.json";

/**
 * Pluggable contacts adapter (marketing runs on Brevo). Default = local JSONL store; Brevo is a stub that is only
 * used when CONTACTS_ADAPTER=brevo AND BREVO_API_KEY are set. Every contact carries explicit CASL consent + a source tag.
 */
export type ListKey = keyof typeof data.contacts.lists;
export type Contact = {
  email: string;
  name?: string;
  business?: string;
  phone?: string;
  lists: ListKey[];
  source: string; // e.g. "form:upgrade", "form:advertise", "form:event", "form:signup", plus utm_source if any
  consent: { given: true; at: string; text: string };
  attributes?: Record<string, string | number | boolean>;
};
export interface ContactsAdapter {
  upsert(c: Contact): Promise<void>;
}

class LocalContacts implements ContactsAdapter {
  async upsert(c: Contact) {
    console.info("[contacts]", c.source, c.lists.join(","));
    if (process.env.VERCEL) return;
    const dir = path.join(process.cwd(), "data");
    await mkdir(dir, { recursive: true });
    await appendFile(path.join(dir, "contacts.jsonl"), JSON.stringify(c) + "\n");
  }
}

/** Brevo Contacts API v3 (POST /v3/contacts, updateEnabled). Not called unless explicitly configured. */
export class BrevoContacts implements ContactsAdapter {
  constructor(private key = process.env.BREVO_API_KEY ?? "") {}
  body(c: Contact) {
    const listIds = c.lists
      .map((k) => data.contacts.lists[k] as number | null)
      .filter((n): n is number => typeof n === "number");
    return {
      email: c.email,
      updateEnabled: true,
      listIds,
      attributes: {
        FIRSTNAME: c.name ?? "",
        COMPANY: c.business ?? "",
        SMS: c.phone ?? "",
        SOURCE: c.source,
        LIST_TAGS: c.lists.join(","),
        CONSENT_AT: c.consent.at,
        CONSENT_TEXT: c.consent.text,
        ...c.attributes,
      },
    };
  }
  async upsert(c: Contact) {
    if (!this.key) throw new Error("BREVO_API_KEY not set");
    const r = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: { "api-key": this.key, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(this.body(c)),
    });
    if (!r.ok && r.status !== 204) throw new Error(`Brevo ${r.status}`);
  }
}

export function contacts(): ContactsAdapter {
  return process.env.CONTACTS_ADAPTER === "brevo" && process.env.BREVO_API_KEY
    ? new BrevoContacts()
    : new LocalContacts();
}

export const CONSENT_TEXT =
  "I agree that Pinoy Pages may email me about my listing, events, advertising and the monthly member email. I can unsubscribe at any time.";
export async function saveContact(c: Omit<Contact, "consent">) {
  try {
    await contacts().upsert({ ...c, consent: { given: true, at: new Date().toISOString(), text: CONSENT_TEXT } });
  } catch (e) {
    console.warn("[contacts] failed", (e as Error).message);
  }
}
