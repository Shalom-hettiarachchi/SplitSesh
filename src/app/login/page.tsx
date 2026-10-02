"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthCard from "@/components/AuthCard";
import GoogleButton from "@/components/GoogleButton";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [googleReady, setGoogleReady] = useState(false);

  useEffect(() => {
    const callbackError = params.get("error");
    if (callbackError) setError(callbackError);

    const load = (url: string) =>
      fetch(url).then((r) => {
        if (!r.ok) throw new Error(`${url} failed`);
        return r.json();
      });

    Promise.all([load("/api/auth/status"), load("/api/auth/google/status")])
      .then(([status, google]) => {
        if (!status.hasUsers) {
          router.replace("/setup");
          return;
        }
        setGoogleReady(google.configured);
        setChecking(false);
      })
      .catch(() => {
        setError("Can't reach the database right now. Try again in a moment.");
        setChecking(false);
      });
  }, [router, params]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error || "Login failed");
      return;
    }
    router.push(params.get("next") || "/");
    router.refresh();
  }

  if (checking) return <p className="p-8 text-center text-sm text-slate-400">Loading…</p>;

  return (
    <AuthCard title="SplitSesh" subtitle="Sign in to log a round or settle up">
      <form onSubmit={submit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Username</label>
          <input
            autoFocus
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
            placeholder="your username"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-500">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none ring-teal-500 focus:border-teal-500 focus:ring-1"
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-60"
        >
          {loading ? "Signing in…" : "Sign in"}
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
        No account yet? Ask your host to add you.
      </p>
    </AuthCard>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
