"use client";
import { useState } from "react";
import { selfEmployedCpp } from "@/lib/calc";

const fmt = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD" });

export function CppTool() {
  const [v, setV] = useState("");
  const r = selfEmployedCpp(Number(v));
  return (
    <form className="rounded-2xl bg-white p-6" onSubmit={(e) => e.preventDefault()}>
      <label className="block font-bold">
        2026 net self-employment income ($)
        <input
          className="field"
          type="number"
          min="0"
          inputMode="decimal"
          value={v}
          onChange={(e) => setV(e.target.value)}
        />
      </label>
      <div role="status" className="mt-6 rounded-lg bg-aqua p-4">
        <dl className="grid gap-2">
          <div className="flex justify-between">
            <dt>Base CPP (11.9%)</dt>
            <dd>{fmt(r.base)}</dd>
          </div>
          <div className="flex justify-between">
            <dt>CPP2 (8%)</dt>
            <dd>{fmt(r.cpp2)}</dd>
          </div>
          <div className="flex justify-between text-lg font-bold">
            <dt>Total CPP to set aside</dt>
            <dd data-testid="cpp-total">{fmt(r.total)}</dd>
          </div>
        </dl>
      </div>
    </form>
  );
}
