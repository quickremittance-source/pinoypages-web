import { DashShell } from "@/components/admin/Charts";

/** Shared chrome for the internal admin tools: title, section links (key carried), flash message. */
export function AdminFrame({
  k,
  title,
  msg,
  children,
}: {
  k: string;
  title: string;
  msg?: string;
  children: React.ReactNode;
}) {
  const q = `?key=${encodeURIComponent(k)}`;
  return (
    <DashShell>
      <header className="border-b-4 border-[#E01820] pb-3">
        <p className="text-xs font-bold uppercase tracking-wide text-[#E01820]">Admin · internal</p>
        <h1 className="text-3xl font-bold text-[#002050]">{title}</h1>
      </header>
      <nav aria-label="Admin" className="flex flex-wrap gap-4 text-sm font-bold text-[#0E7C86] underline">
        <a href={`/admin${q}`}>Hub</a>
        <a href={`/admin/listings${q}`}>Listings</a>
        <a href={`/admin/ads/manage${q}`}>Ads</a>
        <a href={`/admin/inquiries${q}`}>Inquiries</a>
        <a href={`/admin/dashboard${q}`}>Dashboard</a>
        <a href={`/admin/qr${q}`}>QR</a>
        <a href={`/admin/advertisers${q}`}>Advertisers</a>
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
