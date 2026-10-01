import { Cannabis } from "lucide-react";

export default function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-teal-100 shadow-pop">
            <Cannabis size={22} />
          </div>
          <h1
            className={
              title === "SplitSesh"
                ? "font-logo text-3xl uppercase tracking-wide text-ink"
                : "text-xl font-bold text-ink"
            }
          >
            {title}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-pop">{children}</div>
      </div>
    </div>
  );
}
