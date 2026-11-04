type Row = Record<string, unknown>;

/** Hide/Unhide, Delete (archive, confirm tick), Restore and permanent Delete (archived only, type DELETE). */
export function OpButtons({
  action,
  k,
  idName,
  id,
  archived,
  live,
}: {
  action: (fd: FormData) => Promise<void>;
  k: string;
  idName: string;
  id: string;
  archived: boolean;
  live: boolean;
}) {
  const hidden = (
    <>
      <input type="hidden" name="key" value={k} />
      <input type="hidden" name={idName} value={id} />
    </>
  );
  return (
    <section aria-labelledby="ops-h" className="space-y-3 rounded-lg border border-[#d0d4dc] p-4" data-testid="ops">
      <h2 id="ops-h" className="font-bold text-[#002050]">
        Visibility and delete
      </h2>
      {!archived ? (
        <div className="flex flex-wrap items-center gap-3">
          <form action={action}>
            {hidden}
            <input type="hidden" name="op" value={live ? "hide" : "unhide"} />
            <button className="btn px-3 py-2 text-sm">{live ? "Hide" : "Unhide"}</button>
          </form>
          <form action={action} className="flex items-center gap-2">
            {hidden}
            <input type="hidden" name="op" value="archive" />
            <label className="text-sm">
              <input type="checkbox" name="confirm" required /> Yes, delete (moves to archive; can be restored)
            </label>
            <button className="rounded-md border border-[#E01820] px-3 py-2 text-sm font-bold text-[#E01820]">
              Delete
            </button>
          </form>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <form action={action}>
            {hidden}
            <input type="hidden" name="op" value="restore" />
            <button className="btn px-3 py-2 text-sm">Restore</button>
          </form>
          <form action={action} className="flex items-center gap-2">
            {hidden}
            <input type="hidden" name="op" value="delete" />
            <label className="text-sm">
              Type DELETE to remove permanently{" "}
              <input name="confirm" className="field ml-1 w-28" required pattern="DELETE" autoComplete="off" />
            </label>
            <button className="rounded-md bg-[#E01820] px-3 py-2 text-sm font-bold text-white">
              Delete permanently
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

export function AuditLog({ rows }: { rows: Row[] }) {
  return (
    <section aria-labelledby="audit-h" className="rounded-lg border border-[#d0d4dc] p-4" data-testid="audit">
      <h2 id="audit-h" className="font-bold text-[#002050]">
        Change log
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[#5b6475]">No admin changes yet.</p>
      ) : (
        <ul className="mt-2 space-y-1 text-sm">
          {rows.map((r) => {
            const b = (r.before ?? {}) as Row;
            const a = (r.after ?? {}) as Row;
            const keys = Object.keys({ ...b, ...a }).filter(
              (x) =>
                x !== "updated_at" &&
                x !== "search_tsv" &&
                JSON.stringify(b[x] ?? null) !== JSON.stringify(a[x] ?? null),
            );
            return (
              <li key={String(r.id)}>
                <span className="font-mono">{String(r.at)}</span> · {String(r.actor)} ·{" "}
                <strong>{String(r.action)}</strong>
                {keys.length > 0 && (
                  <span className="text-[#5b6475]">
                    {" "}
                    ·{" "}
                    {keys
                      .map((x) => `${x}: ${JSON.stringify(b[x] ?? null)} → ${JSON.stringify(a[x] ?? null)}`)
                      .join("; ")}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
