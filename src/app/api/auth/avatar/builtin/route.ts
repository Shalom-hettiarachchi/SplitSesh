import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { toObjectId } from "@/lib/serialize";
import { builtinAvatarSrc, isValidBuiltinAvatarId } from "@/lib/builtinAvatars";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const id = body.id as string;
  if (!id || !isValidBuiltinAvatarId(id)) {
    return NextResponse.json({ error: "Unknown avatar" }, { status: 400 });
  }

  const avatarUrl = builtinAvatarSrc(id)!;
  const db = await getDb();
  await db.collection("users").updateOne({ _id: toObjectId(session.uid) }, { $set: { avatarUrl } });

  return NextResponse.json({ avatarUrl });
}
