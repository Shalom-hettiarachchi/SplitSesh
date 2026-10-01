import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { getSession } from "@/lib/auth";
import { serializeDoc } from "@/lib/serialize";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const db = await getDb();
  const batches = await db.collection("batches").find().sort({ createdAt: -1 }).toArray();
  return NextResponse.json(batches.map(serializeDoc));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (session.role !== "admin") {
    return NextResponse.json({ error: "Only the host can start a new batch" }, { status: 403 });
  }

  const body = await req.json();
  const { name, unit, unitLabel, quantity, totalCost, payerId, totalGrams } = body;

  if (!name || !unit || !quantity || !totalCost || !payerId) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const db = await getDb();
  const doc = {
    name: String(name).trim(),
    unit,
    // Weed ("gram") batches are still counted and split in whole/half sticks at smoke time —
    // nobody weighs a joint mid-session — so both "stick" and "gram" batches use "stick".
    unitLabel: unit === "custom" ? unitLabel || "unit" : "stick",
    quantity: Number(quantity),
    totalCost: Number(totalCost),
    ...(unit === "gram" && totalGrams ? { totalGrams: Number(totalGrams) } : {}),
    payerId,
    status: "active" as const,
    createdAt: new Date().toISOString(),
  };

  const result = await db.collection("batches").insertOne(doc);
  return NextResponse.json(serializeDoc({ _id: result.insertedId, ...doc }), { status: 201 });
}
