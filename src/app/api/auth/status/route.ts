import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  const db = await getDb();
  const count = await db.collection("users").countDocuments();
  return NextResponse.json({ hasUsers: count > 0 });
}
