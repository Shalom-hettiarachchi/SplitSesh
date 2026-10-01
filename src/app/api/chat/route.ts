import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await getDb();
  const messages = await db
    .collection("messages")
    .find()
    .sort({ createdAt: -1 })
    .limit(300)
    .toArray();
  return NextResponse.json(messages.reverse().map(serializeDoc));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const text = (body.text ?? "").trim().slice(0, 2000);
  if (!text) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }

  const db = await getDb();
  const doc = {
    authorId: session.uid,
    authorName: session.name,
    text,
    createdAt: new Date().toISOString(),
  };
  const result = await db.collection("messages").insertOne(doc);
  return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 });
}
