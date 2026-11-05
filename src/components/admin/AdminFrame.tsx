import { logoutAction } from "@/app/admin/login/actions";
import { DashShell } from "@/components/admin/Charts";

/** Shared chrome for the internal admin tools: title, section links, flash message. */
export function AdminFrame({ title, msg, children }: { title: string; msg?: string; children: React.ReactNode }) {
  return (
    <DashShell>
      <header className="border-b-4 border-[#E01820] pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Admin · internal</p>
        <h1 className="text-3xl font-bold text-[#002050]">{title}</h1>
      </header>
      <nav aria-label="Admin" className="flex flex-wrap gap-4 text-sm font-bold text-[#0E7C86] underline">
        <a href={`/admin`}>Hub</a>
        <a href={`/admin/listings`}>Listings</a>
        <a href={`/admin/ads/manage`}>Ads</a>
        <a href={`/admin/zcard`}>ZCards</a>
        <a href={`/admin/inquiries`}>Inquiries</a>
        <a href={`/admin/dashboard`}>Dashboard</a>
        <a href={`/admin/qr`}>QR</a>
        <a href={`/admin/advertisers`}>Advertisers</a>
        <form action={logoutAction} className="inline">
          <button className="underline">Sign out</button>
        </form>
      </nav>
      {msg && (
        <p role="status" data-testid="msg" className="rounded border border-[#0E7C86] bg-[#0E7C86]/5 p-3 text-sm">
          {msg}
        </p>
      )}
      {children}
    </DashShell>
  );
}

export function NoDb() {
  return (
    <p className="rounded border border-[#d0d4dc] p-4" data-testid="no-db">
      No database connected in this environment, so there is nothing to edit.
    </p>
  );
}

export const SyncWarning = () => (
  <p className="rounded border border-[#E01820] bg-[#E01820]/5 p-3 text-sm" data-testid="sync-warning">
    Brevo sync is paused. If it runs again it can overwrite Neon edits to Brevo-sourced listings, unless the listing is{" "}
    <strong>locked (manual override)</strong>. Saving, hiding or deleting here locks the listing automatically; untick
    Locked to let the sync manage it again.
  </p>
);
