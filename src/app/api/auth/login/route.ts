import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, setSessionCookie, verifyPassword } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function POST(req: Request) {
  const body = await req.json();
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!username || !password) {
    return NextResponse.json({ error: "Username and password are required" }, { status: 400 });
  }

  const db = await getDb();
  const userDoc = await db.collection("users").findOne({ username });
  if (!userDoc || !userDoc.passwordHash) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, userDoc.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid username or password" }, { status: 401 });
  }

  const user = serializeDoc(userDoc);
  const token = await createSessionToken({
    uid: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({ _id: user._id, name: user.name, username: user.username, role: user.role });
}
