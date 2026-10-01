import Link from "next/link";
import { Cannabis, MessageCircle, Settings, ShieldCheck } from "lucide-react";
import type { SessionPayload } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/serialize";
import Avatar from "@/components/Avatar";
import LogoutButton from "@/components/LogoutButton";

export default async function AppHeader({ user }: { user: SessionPayload }) {
  const db = await getDb();
  const doc = await db
    .collection("users")
    .findOne({ _id: toObjectId(user.uid) }, { projection: { avatarUrl: 1 } });
  const avatarUrl = doc?.avatarUrl as string | undefined;

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-ink text-teal-100">
            <Cannabis size={16} />
          </span>
          <span className="font-logo text-xl uppercase tracking-wide text-ink">SplitSesh</span>
        </Link>

        <div className="flex items-center gap-2">
          {user.role === "admin" && (
            <span className="hidden items-center gap-1 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 sm:inline-flex">
              <ShieldCheck size={13} /> Host
            </span>
          )}
          <Link
            href="/chat"
            title="Chat"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
          >
            <MessageCircle size={16} />
          </Link>
          <Link
            href="/settings"
            title="Settings"
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-teal-600"
          >
            <Settings size={16} />
          </Link>
          <Link href="/settings" className="flex items-center gap-2">
            <Avatar name={user.name} avatarUrl={avatarUrl} size="sm" />
            <span className="hidden text-sm font-medium text-ink sm:inline">{user.name}</span>
          </Link>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
