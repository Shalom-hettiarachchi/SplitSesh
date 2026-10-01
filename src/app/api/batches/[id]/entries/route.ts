import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { date, note, amount, participantIds } = body;

  if (!date || !amount || !Array.isArray(participantIds) || participantIds.length === 0) {
    return NextResponse.json(
      { error: "date, amount, and at least one participant are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const doc = {
    batchId: id,
    date,
    note: note || "",
    amount: Number(amount),
    participantIds,
    loggedBy: session.uid,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection("entries").insertOne(doc);
  return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 });
}
