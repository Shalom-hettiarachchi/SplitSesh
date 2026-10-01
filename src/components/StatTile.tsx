import type { LucideIcon } from "lucide-react";

const TONES = {
  teal: { card: "bg-teal-50 border-teal-100", icon: "bg-teal-600 text-white", value: "text-teal-900" },
  amber: { card: "bg-amber-50 border-amber-100", icon: "bg-amber-500 text-white", value: "text-amber-900" },
  violet: { card: "bg-violet-50 border-violet-100", icon: "bg-violet-600 text-white", value: "text-violet-900" },
  rose: { card: "bg-rose-50 border-rose-100", icon: "bg-rose-600 text-white", value: "text-rose-900" },
  sky: { card: "bg-sky-50 border-sky-100", icon: "bg-sky-600 text-white", value: "text-sky-900" },
} as const;

export default function StatTile({
  label,
  value,
  icon: Icon,
  tone = "teal",
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  tone?: keyof typeof TONES;
}) {
  const t = TONES[tone];
  return (
    <div className={`rounded-xl2 border p-4 shadow-card transition hover:-translate-y-0.5 hover:shadow-pop ${t.card}`}>
      <div className="flex items-center gap-2">
        <span className={`flex h-8 w-8 items-center justify-center rounded-lg shadow-sm ${t.icon}`}>
          <Icon size={15} />
        </span>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      </div>
      <p className={`mt-2 text-xl font-bold ${t.value}`}>{value}</p>
    </div>
  );
}
