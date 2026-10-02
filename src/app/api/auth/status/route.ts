import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();
    const count = await db.collection("users").countDocuments();
    return NextResponse.json({ hasUsers: count > 0 });
  } catch (err) {
    console.error("auth/status: database unavailable", err);
    return NextResponse.json({ error: "database_unavailable" }, { status: 503 });
  }
}
