"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Beaker,
  Calendar,
  Check,
  CircleDollarSign,
  ClipboardList,
  Flame,
  PackageCheck,
  PackageOpen,
  Pencil,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { Batch, BatchSummary, ConsumptionEntry, Member, Payment } from "@/lib/types";
import { money, qty, pct } from "@/lib/format";
import { useSession } from "@/components/SessionProvider";
import { useConfirm } from "@/components/ConfirmProvider";
import Avatar from "@/components/Avatar";
import StatTile from "@/components/StatTile";
import UnitIcon from "@/components/UnitIcon";

interface BatchData {
  batch: Batch;
  members: Member[];
  entries: ConsumptionEntry[];
  payments: Payment[];
  summary: BatchSummary;
}

const HERO_IMAGE: Record<string, string> = {
  stick: "/avatars/coughing-smoke.jpg",
  gram: "/avatars/lighter.jpg",
  custom: "/avatars/jar-of-nugs.jpg",
};

function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function BatchDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const session = useSession();
  const confirm = useConfirm();
  const isAdmin = session.role === "admin";
  const batchId = params.id;
  const [data, setData] = useState<BatchData | null>(null);
  const [loading, setLoading] = useState(true);

  const [entryForm, setEntryForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    note: "",
    amount: "",
    participantIds: [] as string[],
  });

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    date: "",
    note: "",
    amount: "",
    participantIds: [] as string[],
  });

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/batches/${batchId}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [batchId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (loading) return <p className="text-sm text-slate-400">Loading…</p>;
  if (!data) return <p className="text-sm text-red-500">Batch not found.</p>;

  const { batch, members, entries, summary } = data;
  const unitWord = batch.unitLabel;

  function toggleParticipant(id: string) {
    setEntryForm((f) => ({
      ...f,
      participantIds: f.participantIds.includes(id)
        ? f.participantIds.filter((p) => p !== id)
        : [...f.participantIds, id],
    }));
  }

  async function addEntry(e: React.FormEvent) {
    e.preventDefault();
    if (!entryForm.amount || entryForm.participantIds.length === 0) return;
    await fetch(`/api/batches/${batchId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...entryForm, amount: Number(entryForm.amount) }),
    });
    setEntryForm({ date: entryForm.date, note: "", amount: "", participantIds: [] });
    refresh();
  }

  async function deleteEntry(entry: ConsumptionEntry) {
    const label = entry.note ? `"${entry.note}"` : `the ${entry.date} round`;
    const ok = await confirm({
      title: `Remove ${label}?`,
      description: `${qty(entry.amount)} ${unitWord}s logged — this can't be undone.`,
      confirmLabel: "Remove",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/batches/${batchId}/entries/${entry._id}`, { method: "DELETE" });
    refresh();
  }

  function startEdit(entry: ConsumptionEntry) {
    setEditingEntryId(entry._id);
    setEditForm({
      date: entry.date,
      note: entry.note,
      amount: String(entry.amount),
      participantIds: entry.participantIds,
    });
  }

  function cancelEdit() {
    setEditingEntryId(null);
  }

  function toggleEditParticipant(id: string) {
    setEditForm((f) => ({
      ...f,
      participantIds: f.participantIds.includes(id)
        ? f.participantIds.filter((p) => p !== id)
        : [...f.participantIds, id],
    }));
  }

  async function saveEdit(entryId: string) {
    if (!editForm.amount || editForm.participantIds.length === 0) return;
    await fetch(`/api/batches/${batchId}/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editForm, amount: Number(editForm.amount) }),
    });
    setEditingEntryId(null);
    refresh();
  }

  async function recordPayment(memberId: string, amount: number) {
    await fetch(`/api/batches/${batchId}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, amount }),
    });
    refresh();
  }

  async function unmarkPaid(memberId: string, name: string) {
    const ok = await confirm({
      title: `Mark ${name} as unpaid?`,
      description: "This clears their payment record for this batch so they owe the balance again.",
      confirmLabel: "Mark unpaid",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/batches/${batchId}/payments?memberId=${memberId}`, { method: "DELETE" });
    refresh();
  }

  async function toggleFinished() {
    await fetch(`/api/batches/${batchId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: batch.status === "finished" ? "active" : "finished" }),
    });
    refresh();
  }

  async function deleteBatch() {
    const ok = await confirm({
      title: `Delete "${batch.name}"?`,
      description: "This removes its whole session log and can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    await fetch(`/api/batches/${batchId}`, { method: "DELETE" });
    router.push("/");
  }

  return (
    <div className="space-y-8">
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-teal-600 hover:underline">
        <ArrowLeft size={14} /> All batches
      </Link>

      <header className="relative overflow-hidden rounded-xl2 bg-ink shadow-pop">
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4 px-6 py-6 pr-28 sm:pr-6">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-teal-300">
              <UnitIcon unit={batch.unit} size={13} />
              {batch.status === "finished" ? "Finished batch" : "Active batch"}
            </p>
            <h1 className="font-logo text-3xl uppercase leading-none tracking-wide text-white sm:text-4xl">
              {batch.name}
            </h1>
            <p className="mt-2 text-sm text-teal-100/80">
              {batch.unit === "gram" && batch.totalGrams ? `${qty(batch.totalGrams)}g → ` : ""}
              {qty(batch.quantity)} {unitWord}s · {money(batch.totalCost)} total · {money(summary.costPerUnit)} /{" "}
              {unitWord}
            </p>
          </div>
          {isAdmin && (
            <div className="relative z-10 flex items-center gap-2">
              <button
                onClick={toggleFinished}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  batch.status === "finished"
                    ? "bg-white/15 text-white hover:bg-white/25"
                    : "bg-teal-500 text-white hover:bg-teal-400"
                }`}
              >
                {batch.status === "finished" ? <PackageOpen size={15} /> : <PackageCheck size={15} />}
                {batch.status === "finished" ? "Reopen" : "Mark finished"}
              </button>
              <button
                onClick={deleteBatch}
                title="Delete batch"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-red-300"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )}
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_IMAGE[batch.unit] ?? HERO_IMAGE.custom}
          alt=""
          className="pointer-events-none absolute -bottom-6 -right-4 h-28 w-28 -rotate-6 rounded-2xl object-cover shadow-2xl ring-4 ring-white/10 sm:h-36 sm:w-36"
        />
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile
          icon={Flame}
          label="Total Consumed"
          value={`${qty(summary.totalConsumed)} / ${qty(batch.quantity)}`}
          tone="amber"
        />
        <StatTile
          icon={Beaker}
          label={`Remaining (${unitWord}s)`}
          value={qty(summary.remainingQuantity)}
          tone="violet"
        />
        <StatTile icon={CircleDollarSign} label="Active Cost" value={money(summary.activeCost)} tone="teal" />
        <StatTile
          icon={CircleDollarSign}
          label="Friends Owe Host"
          value={money(summary.totalOwedToHost)}
          tone="rose"
        />
      </section>

      <section className="overflow-x-auto rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
            <Users size={14} />
          </span>
          <h2 className="font-semibold text-ink">Settlement</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Member</th>
              <th className="px-4 py-2">Consumed</th>
              <th className="px-4 py-2">Owed</th>
              <th className="px-4 py-2">Paid</th>
              <th className="px-4 py-2">Remaining</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {summary.members.map((m) => (
              <tr key={m.memberId} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2.5">
                    <Avatar name={m.name} avatarUrl={members.find((mm) => mm._id === m.memberId)?.avatarUrl} size="md" />
                    <span className="font-medium text-ink">{m.name}</span>
                    {m.isPayer && <span className="text-xs text-slate-400">(Host)</span>}
                  </div>
                </td>
                <td className="px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-teal-500"
                        style={{ width: `${Math.min(m.consumptionPct, 100)}%` }}
                      />
                    </div>
                    <span className="whitespace-nowrap text-xs text-slate-500">
                      {qty(m.consumed)} {unitWord}s · {pct(m.consumptionPct)}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-2">{money(m.amountOwed)}</td>
                <td className="px-4 py-2">{money(m.paid)}</td>
                <td className="px-4 py-2 font-medium">{money(m.remainingDue)}</td>
                <td className="px-4 py-2">
                  <StatusBadge status={m.status} />
                </td>
                <td className="px-4 py-2">
                  {!m.isPayer && (isAdmin || m.memberId === session.uid) && (
                    <>
                      {m.remainingDue > 0.009 && (
                        <button
                          onClick={() => recordPayment(m.memberId, m.remainingDue)}
                          className="flex items-center gap-1 rounded-lg bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100"
                        >
                          <Check size={12} />
                          {m.memberId === session.uid ? "Mark I paid" : "Mark paid"}
                        </button>
                      )}
                      {m.paid > 0.009 && (m.status === "Paid" || m.status === "Partial") && (
                        <button
                          onClick={() => unmarkPaid(m.memberId, m.name)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100"
                        >
                          <X size={12} />
                          Mark unpaid
                        </button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
            <Calendar size={15} />
          </span>
          <h2 className="font-semibold text-ink">Log a session</h2>
        </div>
        <form onSubmit={addEntry} className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Date</label>
              <input
                type="date"
                value={entryForm.date}
                onChange={(e) => setEntryForm({ ...entryForm, date: e.target.value })}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-500">Session name</label>
              <input
                value={entryForm.note}
                onChange={(e) => setEntryForm({ ...entryForm, note: e.target.value })}
                placeholder="e.g. Friday hangout, balcony sesh"
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Amount</label>
              <input
                type="number"
                step="any"
                value={entryForm.amount}
                onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                placeholder={`${unitWord}s smoked`}
                className="w-full rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-slate-500">Who&apos;s in on this round?</p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <label
                  key={m._id}
                  className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                    entryForm.participantIds.includes(m._id)
                      ? "border-teal-500 bg-teal-50 text-teal-700"
                      : "border-slate-200 text-slate-500 hover:border-slate-300"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={entryForm.participantIds.includes(m._id)}
                    onChange={() => toggleParticipant(m._id)}
                  />
                  {m.name}
                </label>
              ))}
            </div>
          </div>
          {entryForm.amount && entryForm.participantIds.length > 0 && (
            <p className="text-xs text-slate-500">
              {unitWord}/person: {qty(Number(entryForm.amount) / entryForm.participantIds.length)}
            </p>
          )}
          <button className="rounded-lg bg-ink px-4 py-1.5 text-sm font-medium text-white transition hover:bg-slate-700">
            Add round
          </button>
        </form>
      </section>

      <section className="overflow-x-auto rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="flex items-center gap-2.5 border-b border-slate-200 px-5 py-3">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
            <ClipboardList size={14} />
          </span>
          <h2 className="font-semibold text-ink">Session Log</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Session</th>
              <th className="px-4 py-2">{unitWord}s</th>
              <th className="px-4 py-2">Participants</th>
              <th className="px-4 py-2">{unitWord}/person</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10">
                  <div className="flex flex-col items-center gap-3 text-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/avatars/gamer.jpg"
                      alt=""
                      className="h-16 w-16 rounded-2xl object-cover shadow-card"
                    />
                    <p className="text-sm text-slate-400">No rounds logged yet — be the first.</p>
                  </div>
                </td>
              </tr>
            )}
            {entries.map((e) => {
              const names = e.participantIds
                .map((id) => members.find((m) => m._id === id)?.name ?? "?")
                .join(", ");
              const canRemove = isAdmin || e.loggedBy === session.uid;

              if (editingEntryId === e._id) {
                return (
                  <tr key={e._id} className="border-t border-slate-100 bg-teal-50/40">
                    <td colSpan={6} className="px-4 py-3">
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
                        <input
                          type="date"
                          value={editForm.date}
                          onChange={(ev) => setEditForm({ ...editForm, date: ev.target.value })}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                        <input
                          value={editForm.note}
                          onChange={(ev) => setEditForm({ ...editForm, note: ev.target.value })}
                          placeholder="Session name"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 sm:col-span-2"
                        />
                        <input
                          type="number"
                          step="any"
                          value={editForm.amount}
                          onChange={(ev) => setEditForm({ ...editForm, amount: ev.target.value })}
                          placeholder={`${unitWord}s smoked`}
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                        />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {members.map((m) => (
                          <label
                            key={m._id}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition ${
                              editForm.participantIds.includes(m._id)
                                ? "border-teal-500 bg-teal-50 text-teal-700"
                                : "border-slate-200 text-slate-500 hover:border-slate-300"
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={editForm.participantIds.includes(m._id)}
                              onChange={() => toggleEditParticipant(m._id)}
                            />
                            {m.name}
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => saveEdit(e._id)}
                          className="flex items-center gap-1 rounded-lg bg-ink px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          <Check size={12} /> Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
                        >
                          <X size={12} /> Cancel
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={e._id} className="border-t border-slate-100 hover:bg-slate-50/80">
                  <td className="px-4 py-2 whitespace-nowrap">
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {formatDate(e.date)}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">{e.note || "—"}</td>
                  <td className="px-4 py-2 font-medium text-ink">{qty(e.amount)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      {e.participantIds.slice(0, 5).map((id, i) => {
                        const p = members.find((mm) => mm._id === id);
                        return (
                          <span
                            key={id}
                            className="-ml-1.5 inline-block rounded-full ring-2 ring-white first:ml-0"
                            style={{ zIndex: 5 - i }}
                            title={p?.name ?? "?"}
                          >
                            <Avatar name={p?.name ?? "?"} avatarUrl={p?.avatarUrl} size="sm" />
                          </span>
                        );
                      })}
                      {e.participantIds.length > 5 && (
                        <span className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-500 ring-2 ring-white">
                          +{e.participantIds.length - 5}
                        </span>
                      )}
                      <span className="ml-2 hidden text-xs text-slate-400 sm:inline">{names}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2">{qty(e.amount / e.participantIds.length)}</td>
                  <td className="px-4 py-2">
                    <div className="flex items-center gap-3">
                      {isAdmin && (
                        <button
                          onClick={() => startEdit(e)}
                          className="flex items-center gap-1 text-xs text-slate-400 hover:text-teal-600"
                        >
                          <Pencil size={12} /> Edit
                        </button>
                      )}
                      {canRemove && (
                        <button
                          onClick={() => deleteEntry(e)}
                          className="text-xs text-slate-400 hover:text-red-500"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    "Paid (Host)": "bg-slate-100 text-slate-500",
    "Not in session": "bg-slate-100 text-slate-400",
    Paid: "bg-green-100 text-green-700",
    Partial: "bg-amber-100 text-amber-700",
    Pending: "bg-red-100 text-red-600",
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status] ?? ""}`}>{status}</span>
  );
}
