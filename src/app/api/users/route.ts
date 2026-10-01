import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession, hashPassword } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await getDb();
  const users = await db
    .collection("users")
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: 1 })
    .toArray();
  return NextResponse.json(users.map(serializeDoc));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can add friends" }, { status: 403 });
  }

  const body = await req.json();
  const name = (body.name ?? "").trim();
  const username = (body.username ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  const email = (body.email ?? "").trim().toLowerCase();

  if (!name || !username || password.length < 4) {
    return NextResponse.json(
      { error: "Name, username, and a password of at least 4 characters are required" },
      { status: 400 }
    );
  }

  const db = await getDb();
  const existing = await db.collection("users").findOne({ username });
  if (existing) {
    return NextResponse.json({ error: "That username is already taken" }, { status: 409 });
  }
  if (email) {
    const existingEmail = await db.collection("users").findOne({ email });
    if (existingEmail) {
      return NextResponse.json({ error: "That Google email is already linked to someone" }, { status: 409 });
    }
  }

  const passwordHash = await hashPassword(password);
  const doc = {
    name,
    username,
    passwordHash,
    ...(email ? { email } : {}),
    role: "friend" as const,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection("users").insertOne(doc);
  const { passwordHash: _omit, ...rest } = doc;
  return NextResponse.json(serializeDoc({ _id: result.insertedId, ...rest }), { status: 201 });
}
