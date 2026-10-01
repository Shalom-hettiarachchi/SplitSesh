"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import GoogleButton from "@/components/GoogleButton";

export default function SetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/status").then((r) => r.json()),
      fetch("/api/auth/google/status").then((r) => r.json()),
    ]).then(([status, google]) => {
      if (status.hasUsers) {
        router.replace("/login");
        return;
      }
      setGoogleReady(google.configured);
      setChecking(false);
    });
  }, [router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Setup failed");
      return;
    }
    router.push("/");
    router.refresh();
  }

  if (checking) return null;

  return (
    <AuthCard title="Welcome to SplitSesh" subtitle="Create the host account to get started">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Your name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
            placeholder="e.g. Alex"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
            placeholder="e.g. alex"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
            placeholder="At least 4 characters"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Creating…" : "Create host account"}
        </button>
      </form>
      {googleReady && (
        <>
          <div className="my-4 flex items-center gap-3 text-xs text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or
            <span className="h-px flex-1 bg-slate-200" />
          </div>
          <GoogleButton label="Continue with Google" />
        </>
      )}
      <p className="mt-4 text-center text-xs text-slate-400">
        You'll be the host — you can add friend accounts afterwards.
      </p>
    </AuthCard>
  );
}
