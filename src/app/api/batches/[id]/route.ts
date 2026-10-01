import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc, toObjectId } from "@/lib/serialize";
import { computeBatchSummary } from "@/lib/settlement";
import type { Batch, ConsumptionEntry, Member, Payment } from "@/lib/types";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();
  const batchDoc = await db.collection("batches").findOne({ _id: toObjectId(id) });
  if (!batchDoc) {
    return NextResponse.json({ error: "Batch not found" }, { status: 404 });
  }
  const batch = serializeDoc(batchDoc) as Batch;

  const [users, entryDocs, paymentDocs] = await Promise.all([
    db
      .collection("users")
      .find({}, { projection: { _id: 1, name: 1, avatarUrl: 1 } })
      .sort({ createdAt: 1 })
      .toArray(),
    db.collection("entries").find({ batchId: batch._id }).sort({ date: 1, createdAt: 1 }).toArray(),
    db.collection("payments").find({ batchId: batch._id }).toArray(),
  ]);

  const entries = entryDocs.map(serializeDoc) as ConsumptionEntry[];
  const payments = paymentDocs.map(serializeDoc) as Payment[];
  const memberList = users.map(serializeDoc) as Member[];

  const summary = computeBatchSummary(batch, memberList, entries, payments);

  return NextResponse.json({ batch, members: memberList, entries, payments, summary });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can edit a batch" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();
  const update: Record<string, unknown> = {};
  for (const key of ["name", "unit", "unitLabel", "quantity", "totalCost", "totalGrams", "payerId", "status"]) {
    if (key in body) update[key] = body[key];
  }

  const db = await getDb();
  await db.collection("batches").updateOne({ _id: toObjectId(id) }, { $set: update });
  const updated = await db.collection("batches").findOne({ _id: toObjectId(id) });
  return NextResponse.json(serializeDoc(updated));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can delete a batch" }, { status: 403 });
  }

  const { id } = await params;
  const db = await getDb();
  await Promise.all([
    db.collection("batches").deleteOne({ _id: toObjectId(id) }),
    db.collection("entries").deleteMany({ batchId: id }),
    db.collection("payments").deleteMany({ batchId: id }),
  ]);
  return NextResponse.json({ ok: true });
}
