import Link from "next/link";
import type { Batch } from "@/lib/types";
import { money, qty } from "@/lib/format";
import UnitIcon from "@/components/UnitIcon";

const UNIT_THEME = {
  stick: { bg: "bg-amber-50", text: "text-amber-600", bar: "bg-amber-400", ring: "hover:border-amber-300" },
  gram: { bg: "bg-teal-50", text: "text-teal-600", bar: "bg-teal-400", ring: "hover:border-teal-300" },
  custom: { bg: "bg-violet-50", text: "text-violet-600", bar: "bg-violet-400", ring: "hover:border-violet-300" },
} as const;

export default function BatchCard({ batch }: { batch: Batch }) {
  const costPerUnit = batch.quantity > 0 ? batch.totalCost / batch.quantity : 0;
  const isFinished = batch.status === "finished";
  const theme = UNIT_THEME[batch.unit];

  return (
    <Link
      href={`/batch/${batch._id}`}
      className={`group relative block overflow-hidden rounded-xl2 border border-slate-200 bg-white p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${theme.ring}`}
    >
      <span className={`absolute inset-x-0 top-0 h-1 ${isFinished ? "bg-slate-200" : theme.bar}`} />

      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
              isFinished ? "bg-slate-100 text-slate-400" : `${theme.bg} ${theme.text}`
            }`}
          >
            <UnitIcon unit={batch.unit} size={17} />
          </span>
          <div>
            <h3 className="font-semibold leading-tight text-ink">{batch.name}</h3>
            <p className="text-xs text-slate-400">
              {batch.unit === "gram" && batch.totalGrams ? `${qty(batch.totalGrams)}g → ` : ""}
              {qty(batch.quantity)} {batch.unitLabel}
              {batch.quantity !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
            isFinished ? "bg-slate-100 text-slate-500" : "bg-teal-100 text-teal-700"
          }`}
        >
          {isFinished ? "Finished" : "Active"}
        </span>
      </div>

      <div className="mt-4 flex items-end justify-between">
        <div>
          <p className="text-xs text-slate-400">Total cost</p>
          <p className="text-sm font-semibold text-ink">{money(batch.totalCost)}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Per {batch.unitLabel}</p>
          <p className={`text-sm font-semibold ${theme.text}`}>{money(costPerUnit)}</p>
        </div>
      </div>
    </Link>
  );
}
