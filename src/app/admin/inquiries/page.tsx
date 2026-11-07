import { requireAdmin } from "@/lib/adminGuard";
import type { Metadata } from "next";
import { planFor } from "@/lib/onboarding";
import { queue } from "@/lib/onboardingDb";
import { DashShell } from "@/components/admin/Charts";
import { decideAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin · inquiries", robots: { index: false, follow: false, nocache: true }, referrer: "no-referrer" };
const TABS = ["new", "won", "lost", "spam", "all"];

/** Onboarding queue. ADMIN_KEY gated (404 otherwise). Approve creates the Neon listing or a draft ad; never writes Brevo. */
export default async function Page({ searchParams }: { searchParams: Promise<{ status?: string; msg?: string }> }) {
  const { status = "new", msg } = await searchParams;
  await requireAdmin("/admin/inquiries");
  const st = TABS.includes(status) ? status : "new";
  const rows = await queue(st).catch(() => "error" as const);
  return (
    <DashShell>
      <header className="border-b-4 border-[#E01820] pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Admin</p>
        <h1 className="text-3xl font-bold text-[#002050]">Inquiry queue</h1>
        <p className="text-sm text-[#5b6475]">
          Approve creates or updates the listing in Neon (or a draft ad/ZCard) and its first QR code. Brevo sync is paused:
          <strong> update the Brevo record yourself</strong> after approving. Nothing is emailed.
        </p>
      </header>
      {msg && <p role="status" className="rounded border border-[#0E7C86] p-2 text-sm" data-testid="msg">{msg}</p>}
      <nav className="flex gap-2 text-sm">
        {TABS.map((t) => (
          <a key={t} href={`/admin/inquiries?status=${t}`} aria-current={t === st ? "page" : undefined} className={`rounded px-3 py-1 font-bold ${t === st ? "bg-[#002050] text-white" : "border border-[#002050] text-[#002050]"}`}>{t}</a>
        ))}
      </nav>
      {rows === null || rows === "error" ? (
        <p className="rounded border border-[#d0d4dc] p-4" data-testid="no-db">{rows === "error" ? "Could not load inquiries." : "No database connected in this environment."}</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-[#5b6475]">Nothing here.</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r) => {
            const plan = planFor({ ...r, id: Number(r.id) });
            const listing = r.created_ref?.startsWith("listing:") ? r.created_ref.slice(8) : null;
            return (
              <li key={r.id} className="rounded-lg border border-[#d0d4dc] p-4 text-sm">
                <p className="font-bold text-[#002050]">#{r.id} · {r.kind} · {r.business || r.name || "—"} <span className="font-normal text-[#5b6475]">({r.status}, {r.created_at})</span></p>
                <p className="text-[#5b6475]">{r.product ? `product: ${r.product} · ` : ""}{r.listing_id ? `listing: ${r.listing_id} · ` : ""}approve will: {plan.type === "none" ? plan.reason : plan.type === "listing" ? `${plan.mode} listing ${plan.listing_id} (${plan.tier})` : `create draft ${plan.tier} ad ${plan.slug}`}</p>
                <form action={decideAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="id" value={r.id} />
                  <button name="d" value="approve" disabled={plan.type === "none"} className="rounded bg-[#0E7C86] px-3 py-1 font-bold text-white disabled:opacity-40">Approve</button>
                  <button name="d" value="reject" className="rounded border border-[#002050] px-3 py-1 font-bold text-[#002050]">Reject</button>
                  <button name="d" value="spam" className="rounded border border-[#E01820] px-3 py-1 font-bold text-[#E01820]">Spam</button>
                  {listing && <a className="self-center underline" href={`/admin/welcome/${encodeURIComponent(listing)}`}>Welcome pack</a>}
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </DashShell>
  );
}
