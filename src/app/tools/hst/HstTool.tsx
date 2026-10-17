"use client";
import { useState } from "react";
import { hstCheck } from "@/lib/calc";

export function HstTool() {
  const [q, setQ] = useState(["", "", "", ""]);
  const [ride, setRide] = useState(false);
  const r = hstCheck(q.map(Number), ride);
  return (
    <form className="rounded-2xl bg-white p-6" onSubmit={(e) => e.preventDefault()}>
      <div className="grid gap-4 sm:grid-cols-2">
        {q.map((v, i) => (
          <label key={i} className="block font-bold">
            Quarter {i + 1} sales ($)
            <input
              className="field"
              inputMode="decimal"
              type="number"
              min="0"
              value={v}
              onChange={(e) => setQ(q.map((x, j) => (j === i ? e.target.value : x)))}
            />
          </label>
        ))}
      </div>
      <label className="mt-4 flex items-center gap-2">
        <input type="checkbox" checked={ride} onChange={(e) => setRide(e.target.checked)} /> I drive taxi or ride-share
      </label>
      <p
        role="status"
        className={`mt-6 rounded-lg p-4 font-bold ${r.verdict === "optional" ? "bg-aqua" : "bg-sand text-coral-dk"}`}
      >
        {r.message}
      </p>
    </form>
  );
}
