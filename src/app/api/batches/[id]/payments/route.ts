import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { memberId, amount, date } = body;

  if (!memberId || !amount) {
    return NextResponse.json({ error: "memberId and amount are required" }, { status: 400 });
  }

  if (session.role !== "admin" && memberId !== session.uid) {
    return NextResponse.json(
      { error: "You can only record your own payments — ask the host to confirm others'" },
      { status: 403 }
    );
  }

  const db = await getDb();
  const doc = {
    batchId: id,
    memberId,
    amount: Number(amount),
    date: date || new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection("payments").insertOne(doc);
  return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const memberId = new URL(req.url).searchParams.get("memberId");
  if (!memberId) {
    return NextResponse.json({ error: "memberId is required" }, { status: 400 });
  }

  if (session.role !== "admin" && memberId !== session.uid) {
    return NextResponse.json(
      { error: "You can only undo your own payments — ask the host to undo others'" },
      { status: 403 }
    );
  }

  const db = await getDb();
  await db.collection("payments").deleteMany({ batchId: id, memberId });
  return NextResponse.json({ ok: true });
}
