"use client";

import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/gtag";
import { CHECKLIST_ITEMS, CHECKLIST_PHASES, NEWCOMER_COPY, STORAGE_KEY, bi } from "@/lib/newcomer";

export function ChecklistTool() {
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDone(JSON.parse(raw) as Record<string, boolean>);
    } catch {
      /* blocked */
    }
    setReady(true);
    track("checklist_view", {});
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(done));
    } catch {
      /* blocked */
    }
  }, [done, ready]);

  const total = CHECKLIST_ITEMS.length;
  const completed = useMemo(() => CHECKLIST_ITEMS.filter((i) => done[i.id]).length, [done]);

  function toggle(id: string) {
    setDone((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      const count = CHECKLIST_ITEMS.filter((i) => next[i.id]).length;
      track("checklist_progress", { item_id: id, completed: count, total });
      return next;
    });
  }

  function reset() {
    setDone({});
    track("checklist_reset", {});
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl bg-aqua/40 p-5">
        <div>
          <p className="text-sm font-semibold text-muted">{bi(NEWCOMER_COPY.progress)}</p>
          <p className="text-2xl font-bold text-turqdk" data-testid="checklist-progress">
            {completed} / {total}
          </p>
        </div>
        <button type="button" className="btn px-4 py-2 text-sm" onClick={reset} data-testid="checklist-reset">
          {bi(NEWCOMER_COPY.reset)}
        </button>
      </div>

      {CHECKLIST_PHASES.map((phase) => {
        const items = CHECKLIST_ITEMS.filter((i) => i.phase === phase.id);
        return (
          <section key={phase.id} aria-labelledby={`phase-${phase.id}`} className="space-y-3">
            <h2 id={`phase-${phase.id}`} className="text-xl font-bold text-ink">
              {bi(phase)}
            </h2>
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.id}
                  className="rounded-2xl bg-white p-5 shadow-sm"
                  data-testid="checklist-item"
                  data-item={item.id}
                >
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={!!done[item.id]}
                      onChange={() => toggle(item.id)}
                      data-testid={`check-${item.id}`}
                    />
                    <span>
                      <span className="block font-bold text-ink">{item.title.en}</span>
                      <span className="mt-0.5 block text-sm text-muted">{item.title.tl}</span>
                    </span>
                  </label>
                  <p className="mt-3 text-sm text-muted">{item.detail.en}</p>
                  <p className="mt-1 text-sm text-muted">{item.detail.tl}</p>
                  <p className="mt-3 text-sm">
                    <a
                      className="font-semibold text-turqdk underline"
                      href={item.href}
                      rel="noopener noreferrer"
                      target="_blank"
                      onClick={() => track("checklist_source_click", { item_id: item.id })}
                    >
                      {bi(NEWCOMER_COPY.openSource)} — {item.source}
                    </a>
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <p className="text-sm text-muted" data-testid="checklist-privacy">
        {bi(NEWCOMER_COPY.privacy)}
      </p>
    </div>
  );
}
