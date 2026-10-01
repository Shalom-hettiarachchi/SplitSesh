import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession, hashPassword, verifyPassword } from "@/lib/auth";
import { toObjectId } from "@/lib/serialize";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const currentPassword = body.currentPassword ?? "";
  const newPassword = body.newPassword ?? "";

  if (newPassword.length < 4) {
    return NextResponse.json({ error: "New password must be at least 4 characters" }, { status: 400 });
  }

  const db = await getDb();
  const userDoc = await db.collection("users").findOne({ _id: toObjectId(session.uid) });
  if (!userDoc) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const ok = userDoc.passwordHash ? await verifyPassword(currentPassword, userDoc.passwordHash) : false;
  if (!ok) {
    return NextResponse.json(
      { error: userDoc.passwordHash ? "Current password is incorrect" : "This account signs in with Google — no password set" },
      { status: 403 }
    );
  }

  const passwordHash = await hashPassword(newPassword);
  await db.collection("users").updateOne({ _id: toObjectId(session.uid) }, { $set: { passwordHash } });

  return NextResponse.json({ ok: true });
}
