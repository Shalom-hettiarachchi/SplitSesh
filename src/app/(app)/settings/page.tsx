"use client";

import { useEffect, useRef, useState } from "react";
import { Check, KeyRound, Upload, UserCircle } from "lucide-react";
import { BUILTIN_AVATARS } from "@/lib/builtinAvatars";
import { useSession } from "@/components/SessionProvider";
import Avatar from "@/components/Avatar";

interface Me {
  _id: string;
  name: string;
  username: string;
  role: string;
  email?: string;
  avatarUrl?: string;
}

export default function SettingsPage() {
  const session = useSession();
  const [me, setMe] = useState<Me | null>(null);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwSaving, setPwSaving] = useState(false);

  async function refreshMe() {
    const res = await fetch("/api/auth/me");
    if (res.ok) setMe(await res.json());
  }

  useEffect(() => {
    refreshMe();
  }, []);

  async function pickBuiltin(id: string) {
    setAvatarError("");
    setSavingAvatar(true);
    const res = await fetch("/api/auth/avatar/builtin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setSavingAvatar(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAvatarError(data.error || "Couldn't set that avatar");
      return;
    }
    refreshMe();
  }

  async function uploadFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError("");
    setSavingAvatar(true);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/auth/avatar/upload", { method: "POST", body: formData });
    setSavingAvatar(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setAvatarError(data.error || "Upload failed");
      return;
    }
    refreshMe();
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      setPwError("New passwords don't match");
      return;
    }
    setPwSaving(true);
    const res = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      }),
    });
    setPwSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setPwError(data.error || "Couldn't change password");
      return;
    }
    setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    setPwSuccess("Password updated.");
  }

  return (
    <div className="max-w-2xl space-y-8">
      <header className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
          <UserCircle size={18} />
        </span>
        <div>
          <h1 className="font-logo text-2xl uppercase leading-none tracking-wide text-ink">Settings</h1>
          <p className="text-sm text-slate-500">Manage your profile and account for {session.name}.</p>
        </div>
      </header>

      <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <UserCircle size={15} />
          </span>
          <h2 className="font-semibold text-ink">Avatar</h2>
        </div>

        <div className="flex items-center gap-4">
          <Avatar name={me?.name ?? session.name} avatarUrl={me?.avatarUrl} size="lg" />
          <div className="text-sm text-slate-500">
            <p className="font-medium text-ink">{me?.name ?? session.name}</p>
            <p>@{me?.username ?? session.username}</p>
            {me?.email && <p>{me.email}</p>}
          </div>
        </div>

        <div className="mt-5">
          <p className="mb-2 text-xs font-medium text-slate-500">Pick a built-in avatar</p>
          <div className="flex flex-wrap gap-3">
            {BUILTIN_AVATARS.map((a) => {
              const selected = me?.avatarUrl === a.src;
              return (
                <button
                  key={a.id}
                  onClick={() => pickBuiltin(a.id)}
                  disabled={savingAvatar}
                  title={a.label}
                  className={`relative h-14 w-14 overflow-hidden rounded-full border-2 transition disabled:opacity-50 ${
                    selected ? "border-teal-500" : "border-transparent hover:border-teal-200"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={a.src} alt={a.label} className="h-full w-full object-cover" />
                  {selected && (
                    <span className="absolute inset-0 flex items-center justify-center bg-ink/30">
                      <Check size={18} className="text-white" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={savingAvatar}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            <Upload size={14} /> {savingAvatar ? "Saving…" : "Upload a photo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={uploadFile}
            className="hidden"
          />
          <span className="text-xs text-slate-400">JPG, PNG, WEBP or GIF, up to 5MB</span>
        </div>
        {avatarError && <p className="mt-2 text-xs text-red-500">{avatarError}</p>}
      </section>

      <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <KeyRound size={15} />
          </span>
          <h2 className="font-semibold text-ink">Change password</h2>
        </div>
        <form onSubmit={changePassword} className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Current password</label>
            <input
              type="password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
              className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">New password</label>
            <input
              type="password"
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
              placeholder="At least 4 characters"
              className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-500">Confirm new password</label>
            <input
              type="password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
              className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </div>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          {pwSuccess && <p className="text-xs text-teal-600">{pwSuccess}</p>}
          <button
            disabled={pwSaving}
            className="rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            {pwSaving ? "Saving…" : "Update password"}
          </button>
        </form>
      </section>
    </div>
  );
}
