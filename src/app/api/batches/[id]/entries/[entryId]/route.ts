import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc, toObjectId } from "@/lib/serialize";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can edit a logged round" }, { status: 403 });
  }

  const { id, entryId } = await params;
  const body = await req.json();
  const { date, note, amount, participantIds } = body;

  if (!date || !amount || !Array.isArray(participantIds) || participantIds.length === 0) {
    return NextResponse.json(
      { error: "date, amount, and at least one participant are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const update = {
    date,
    note: note || "",
    amount: Number(amount),
    participantIds,
  };
  await db.collection("entries").updateOne({ _id: toObjectId(entryId), batchId: id }, { $set: update });
  const updated = await db.collection("entries").findOne({ _id: toObjectId(entryId), batchId: id });
  return NextResponse.json(serializeDoc(updated));
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; entryId: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id, entryId } = await params;
  const db = await getDb();

  if (session.role !== "admin") {
    const entry = await db.collection("entries").findOne({ _id: toObjectId(entryId), batchId: id });
    if (!entry || entry.loggedBy !== session.uid) {
      return NextResponse.json(
        { error: "You can only remove rounds you logged yourself" },
        { status: 403 }
      );
    }
  }

  await db.collection("entries").deleteOne({ _id: toObjectId(entryId), batchId: id });
  return NextResponse.json({ ok: true });
}
