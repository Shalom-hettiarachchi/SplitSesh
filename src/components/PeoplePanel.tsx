"use client";

import { useState } from "react";
import { ShieldCheck, Users, UserPlus, X } from "lucide-react";
import type { AppUser } from "@/lib/types";
import { useSession } from "@/components/SessionProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import Avatar from "@/components/Avatar";

export default function PeoplePanel({
  users,
  onChange,
}: {
  users: AppUser[];
  onChange: () => void;
}) {
  const session = useSession();
  const confirm = useConfirm();
  const isAdmin = session.role === "admin";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", username: "", password: "", email: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addFriend(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!form.name || !form.username || !form.password) return;
    setSaving(true);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Couldn't add that person");
      return;
    }
    setForm({ name: "", username: "", password: "", email: "" });
    setOpen(false);
    onChange();
  }

  async function removeUser(id: string, name: string) {
    const ok = await confirm({
      title: `Remove ${name}?`,
      description: "They won't be able to log in anymore.",
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/users/${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600">
            <Users size={15} />
          </span>
          <h2 className="font-semibold text-ink">People</h2>
        </div>
        {isAdmin && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-1 rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
          >
            <UserPlus size={13} /> Add friend
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {users.map((u) => (
          <div
            key={u._id}
            className="group flex items-center gap-2 rounded-full border border-slate-200 py-1 pl-1 pr-3"
          >
            <Avatar name={u.name} avatarUrl={u.avatarUrl} size="sm" />
            <span className="text-sm text-ink">{u.name}</span>
            {u.role === "admin" && <ShieldCheck size={13} className="text-teal-600" />}
            {isAdmin && u._id !== session.uid && (
              <button
                onClick={() => removeUser(u._id, u.name)}
                className="text-slate-300 opacity-0 transition group-hover:opacity-100 hover:text-red-500"
                title="Remove"
              >
                <X size={13} />
              </button>
            )}
          </div>
        ))}
        {users.length === 0 && <span className="text-sm text-slate-400">No one here yet.</span>}
      </div>

      {isAdmin && open && (
        <form onSubmit={addFriend} className="mt-4 grid grid-cols-1 gap-2 border-t border-slate-100 pt-4 sm:grid-cols-5">
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <input
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            placeholder="Username"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Temp password"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Google email (optional)"
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
          />
          <button
            disabled={saving}
            className="rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {saving ? "Adding…" : "Add"}
          </button>
          {error && <p className="text-xs text-red-500 sm:col-span-5">{error}</p>}
          <p className="text-xs text-slate-400 sm:col-span-5">
            Share the username and temp password with them. Add their Google email too and they can also sign
            in with the "Continue with Google" button instead.
          </p>
        </form>
      )}
    </section>
  );
}
