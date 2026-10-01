import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { toObjectId } from "@/lib/serialize";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can remove people" }, { status: 403 });
  }
  if (id === session.uid) {
    return NextResponse.json({ error: "You can't remove your own account" }, { status: 400 });
  }

  const db = await getDb();
  const target = await db.collection("users").findOne({ _id: toObjectId(id) });
  if (target?.role === "admin") {
    const adminCount = await db.collection("users").countDocuments({ role: "admin" });
    if (adminCount <= 1) {
      return NextResponse.json({ error: "Can't remove the last host account" }, { status: 400 });
    }
  }

  await db.collection("users").deleteOne({ _id: toObjectId(id) });
  return NextResponse.json({ ok: true });
}
