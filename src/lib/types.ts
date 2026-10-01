export type Unit = "stick" | "gram" | "custom";
export type Role = "admin" | "friend";

export interface AppUser {
  _id: string;
  name: string;
  username: string;
  email?: string;
  googleId?: string;
  avatarUrl?: string;
  role: Role;
  createdAt: string;
}

// Lightweight projection used wherever only identity (not credentials) is needed.
export type Member = Pick<AppUser, "_id" | "name" | "avatarUrl">;

export interface ChatMessage {
  _id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Batch {
  _id: string;
  name: string; // e.g. "Pack #1", "Weed Batch #1"
  unit: Unit;
  unitLabel: string; // "stick", or custom label — sessions are always logged/split in this unit
  quantity: number; // total sticks (or custom units) this batch covers — drives all settlement math
  totalCost: number;
  totalGrams?: number; // reference only (unit === "gram"): how many grams were bought to make `quantity` sticks
  payerId: string; // user who fronted the money (the host for this batch)
  status: "active" | "finished";
  createdAt: string;
}

export interface ConsumptionEntry {
  _id: string;
  batchId: string;
  date: string;
  note: string;
  amount: number; // total units consumed in this round
  participantIds: string[]; // users who shared this round, split evenly
  loggedBy: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  batchId: string;
  memberId: string;
  amount: number;
  date: string;
  createdAt: string;
}

export interface MemberSettlement {
  memberId: string;
  name: string;
  isPayer: boolean;
  consumed: number; // units consumed
  consumptionPct: number; // 0-100
  amountOwed: number;
  paid: number;
  remainingDue: number;
  status: "Paid (Host)" | "Not in session" | "Paid" | "Partial" | "Pending";
}

export interface BatchSummary {
  batch: Batch;
  costPerUnit: number;
  totalConsumed: number;
  remainingQuantity: number;
  activeCost: number; // cost of what's been consumed so far
  totalOwedToHost: number; // sum of what friends (non-payer) owe
  members: MemberSettlement[];
}
