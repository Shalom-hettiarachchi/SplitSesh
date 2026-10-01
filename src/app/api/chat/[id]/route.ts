import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { toObjectId } from "@/lib/serialize";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const db = await getDb();

  if (session.role !== "admin") {
    const msg = await db.collection("messages").findOne({ _id: toObjectId(id) });
    if (!msg || msg.authorId !== session.uid) {
      return NextResponse.json({ error: "You can only delete your own messages" }, { status: 403 });
    }
  }

  await db.collection("messages").deleteOne({ _id: toObjectId(id) });
  return NextResponse.json({ ok: true });
}
