import GoogleIcon from "@/components/GoogleIcon";

export default function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/api/auth/google/start"
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-slate-50"
    >
      <GoogleIcon size={16} />
      {label}
    </a>
  );
}
