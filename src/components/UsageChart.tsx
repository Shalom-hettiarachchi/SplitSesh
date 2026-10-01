"use client";

import { useState } from "react";
import type { Batch } from "@/lib/types";
import { money } from "@/lib/format";

export default function UsageChart({ batches }: { batches: Batch[] }) {
  const [hoverId, setHoverId] = useState<string | null>(null);

  const rows = [...batches].sort((a, b) => b.totalCost - a.totalCost).slice(0, 8);
  const max = Math.max(...rows.map((b) => b.totalCost), 1);

  if (rows.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-slate-400">
        No batches yet — spending by batch will show up here.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((b) => {
        const pct = Math.max((b.totalCost / max) * 100, 3);
        const isHover = hoverId === b._id;
        return (
          <div
            key={b._id}
            className="group"
            onMouseEnter={() => setHoverId(b._id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <div className="mb-1 flex items-baseline justify-between text-xs">
              <span className="font-medium text-ink">{b.name}</span>
              <span className={`tabular-nums ${isHover ? "text-teal-700" : "text-slate-500"}`}>
                {money(b.totalCost)}
              </span>
            </div>
            <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                title={`${b.name}: ${money(b.totalCost)}`}
                className={`h-full rounded-full transition-all ${isHover ? "bg-teal-700" : "bg-teal-500"}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
