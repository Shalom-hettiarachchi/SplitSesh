import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { createSessionToken, hashPassword, setSessionCookie } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function POST(req: Request) {
  const body = await req.json();
  const name = (body.name ?? "").trim();
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";

  if (!name || !username || password.length < 4) {
    return NextResponse.json(
      { error: "Name, username, and a password of at least 4 characters are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const existingCount = await db.collection("users").countDocuments();
  if (existingCount > 0) {
    return NextResponse.json(
      { error: "Setup already complete. Please log in instead." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const doc = {
    name,
    username,
    passwordHash,
    role: "admin" as const,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection("users").insertOne(doc);
  const user = serializeDoc({ _id: result.insertedId, ...doc });

  const token = await createSessionToken({
    uid: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(token);

  return NextResponse.json({ _id: user._id, name: user.name, username: user.username, role: user.role });
}
