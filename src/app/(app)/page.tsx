"use client";

import { useEffect, useState } from "react";
import { BarChart3, Package, Plus, Users, Wallet } from "lucide-react";
import type { AppUser, Batch, Unit } from "@/lib/types";
import { money } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import PeoplePanel from "@/components/PeoplePanel";
import BatchCard from "@/components/BatchCard";
import UnitIcon from "@/components/UnitIcon";
import StatTile from "@/components/StatTile";
import UsageChart from "@/components/UsageChart";

export default function Dashboard() {
  const session = useSession();
  const isAdmin = session.role === "admin";

  const [users, setUsers] = useState<AppUser[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBatchOpen, setNewBatchOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    unit: "stick" as Unit,
    unitLabel: "",
    totalGrams: "",
    quantity: "",
    totalCost: "",
    payerId: "",
  });

  async function refresh() {
    const [u, b] = await Promise.all([
      fetch("/api/users").then((r) => r.json()),
      fetch("/api/batches").then((r) => r.json()),
    ]);
    setUsers(u);
    setBatches(b);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createBatch(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.quantity || !form.totalCost || !form.payerId) return;
    if (form.unit === "gram" && !form.totalGrams) return;
    await fetch("/api/batches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        quantity: Number(form.quantity),
        totalCost: Number(form.totalCost),
        totalGrams: form.totalGrams ? Number(form.totalGrams) : undefined,
      }),
    });
    setForm({ name: "", unit: "stick", unitLabel: "", totalGrams: "", quantity: "", totalCost: "", payerId: "" });
    setNewBatchOpen(false);
    refresh();
  }

  const quantityPlaceholders: Record<Unit, string> = {
    stick: "e.g. 17 (sticks in a pack)",
    gram: "e.g. 20 (sticks this makes)",
    custom: "e.g. 1 (number of units)",
  };

  // Everyone counts whole/half sticks when smoking, even for weed — nobody weighs a joint
  // mid-session. "gram" only changes the icon; consumption is always tracked in sticks.
  const countWord = (unit: Unit) => (unit === "custom" ? undefined : "stick");

  const active = batches.filter((b) => b.status === "active");
  const finished = batches.filter((b) => b.status === "finished");
  const totalSpent = batches.reduce((sum, b) => sum + b.totalCost, 0);

  return (
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-xl2 bg-ink shadow-pop">
        <div className="relative z-10 px-6 py-8 pr-28 sm:max-w-md sm:pr-6">
          <h1 className="font-logo text-4xl uppercase leading-none tracking-wide text-white sm:text-5xl">
            Hey {session.name.split(" ")[0]}
          </h1>
          <p className="mt-2 text-sm text-teal-100/80">
            Track who smoked what, and who still owes for it.
          </p>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/avatars/smirk-leaf.jpg"
          alt=""
          className="pointer-events-none absolute -bottom-8 -right-6 h-36 w-36 rotate-6 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10 sm:h-48 sm:w-48"
        />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile icon={Users} label="People" value={String(users.length)} tone="sky" />
        <StatTile icon={Package} label="Active Batches" value={String(active.length)} tone="amber" />
        <StatTile icon={Wallet} label="Total Spent" value={money(totalSpent)} tone="violet" />
      </section>

      {batches.length > 0 && (
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <BarChart3 size={15} />
            </span>
            <h2 className="font-semibold text-ink">Spending by batch</h2>
          </div>
          <UsageChart batches={batches} />
        </section>
      )}

      <PeoplePanel users={users} onChange={refresh} />

      {isAdmin && (
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Package size={15} />
              </span>
              <h2 className="font-semibold text-ink">Start a new batch</h2>
            </div>
            {!newBatchOpen && (
              <button
                onClick={() => setNewBatchOpen(true)}
                className="flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
              >
                <Plus size={13} /> New batch
              </button>
            )}
          </div>

          {newBatchOpen && (
            <>
              <form onSubmit={createBatch} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-6">
                <input
                  autoFocus
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Batch name (e.g. Pack #1, Weed Batch #1)"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:col-span-2"
                />
                <select
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value as Unit })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="stick">Sticks (cigarettes)</option>
                  <option value="gram">Grams (weed)</option>
                  <option value="custom">Custom unit</option>
                </select>
                {form.unit === "custom" && (
                  <input
                    value={form.unitLabel}
                    onChange={(e) => setForm({ ...form, unitLabel: e.target.value })}
                    placeholder="Unit label (e.g. ml, piece)"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                )}
                {form.unit === "gram" && (
                  <input
                    value={form.totalGrams}
                    onChange={(e) => setForm({ ...form, totalGrams: e.target.value })}
                    placeholder="e.g. 10 (grams bought)"
                    type="number"
                    step="any"
                    className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                  />
                )}
                <input
                  value={form.quantity}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                  placeholder={quantityPlaceholders[form.unit]}
                  type="number"
                  step="any"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <input
                  value={form.totalCost}
                  onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                  placeholder="Total cost (e.g. 50000)"
                  type="number"
                  step="any"
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                />
                <select
                  value={form.payerId}
                  onChange={(e) => setForm({ ...form, payerId: e.target.value })}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">Who paid?</option>
                  {users.map((u) => (
                    <option key={u._id} value={u._id}>
                      {u.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2 sm:col-span-6">
                  <button className="flex items-center justify-center gap-1 rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700">
                    <Plus size={15} /> Create batch
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewBatchOpen(false)}
                    className="rounded-lg px-4 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100"
                  >
                    Cancel
                  </button>
                </div>
              </form>
              {form.quantity && form.totalCost && Number(form.quantity) > 0 && (
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <UnitIcon unit={form.unit} size={13} />
                    Cost per {countWord(form.unit) ?? (form.unitLabel || "unit")}:{" "}
                    <span className="font-semibold text-ink">
                      {money(Number(form.totalCost) / Number(form.quantity))}
                    </span>
                  </span>
                  {form.unit === "gram" && form.totalGrams && Number(form.totalGrams) > 0 && (
                    <span>
                      Cost per gram bought:{" "}
                      <span className="font-semibold text-ink">
                        {money(Number(form.totalCost) / Number(form.totalGrams))}
                      </span>
                    </span>
                  )}
                </p>
              )}
            </>
          )}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Package size={15} />
          </span>
          <h2 className="font-semibold text-ink">Batches</h2>
        </div>
        {loading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : batches.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-xl2 border border-dashed border-slate-300 bg-white/50 p-10 text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/avatars/jar-of-nugs.jpg" alt="" className="h-16 w-16 rounded-2xl object-cover shadow-card" />
            <p className="text-sm text-slate-400">
              No batches yet{isAdmin ? " — start the first one." : " — ask your host to start one."}
            </p>
            {isAdmin && (
              <button
                onClick={() => setNewBatchOpen(true)}
                className="flex items-center gap-1 rounded-full bg-ink px-4 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
              >
                <Plus size={13} /> Start a batch
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {active.length > 0 && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {active.map((b) => (
                  <BatchCard key={b._id} batch={b} />
                ))}
              </div>
            )}
            {finished.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Finished</p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {finished.map((b) => (
                    <BatchCard key={b._id} batch={b} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
