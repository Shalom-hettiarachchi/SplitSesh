import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { toObjectId } from "@/lib/serialize";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const db = await getDb();
  const doc = await db
    .collection("users")
    .findOne(
      { _id: toObjectId(session.uid) },
      { projection: { avatarUrl: 1, email: 1, username: 1, name: 1, role: 1 } }
    );

  return NextResponse.json({
    _id: session.uid,
    name: doc?.name ?? session.name,
    username: doc?.username ?? session.username,
    role: doc?.role ?? session.role,
    email: doc?.email,
    avatarUrl: doc?.avatarUrl,
  });
}
