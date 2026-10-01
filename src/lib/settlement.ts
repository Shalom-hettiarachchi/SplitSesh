import type { Batch, ConsumptionEntry, Member, Payment, BatchSummary, MemberSettlement } from "./types";

export function computeBatchSummary(
  batch: Batch,
  members: Member[],
  entries: ConsumptionEntry[],
  payments: Payment[]
): BatchSummary {
  const costPerUnit = batch.quantity > 0 ? batch.totalCost / batch.quantity : 0;

  const consumedByMember = new Map<string, number>();
  let totalConsumed = 0;

  for (const entry of entries) {
    const n = entry.participantIds.length;
    if (n === 0) continue;
    const share = entry.amount / n;
    totalConsumed += entry.amount;
    for (const memberId of entry.participantIds) {
      consumedByMember.set(memberId, (consumedByMember.get(memberId) ?? 0) + share);
    }
  }

  const paidByMember = new Map<string, number>();
  for (const p of payments) {
    paidByMember.set(p.memberId, (paidByMember.get(p.memberId) ?? 0) + p.amount);
  }

  const memberSettlements: MemberSettlement[] = members.map((m) => {
    const consumed = consumedByMember.get(m._id) ?? 0;
    const amountOwed = consumed * costPerUnit;
    const isPayer = m._id === batch.payerId;
    const paid = isPayer ? amountOwed : paidByMember.get(m._id) ?? 0;
    const remainingDue = Math.max(amountOwed - paid, 0);
    const consumptionPct = totalConsumed > 0 ? (consumed / totalConsumed) * 100 : 0;

    let status: MemberSettlement["status"];
    if (isPayer) status = "Paid (Host)";
    else if (consumed <= 0 && paid <= 0) status = "Not in session";
    else if (remainingDue <= 0.01) status = "Paid";
    else if (paid > 0) status = "Partial";
    else status = "Pending";

    return {
      memberId: m._id,
      name: m.name,
      isPayer,
      consumed,
      consumptionPct,
      amountOwed,
      paid,
      remainingDue,
      status,
    };
  });

  const totalOwedToHost = memberSettlements
    .filter((m) => !m.isPayer)
    .reduce((sum, m) => sum + m.remainingDue, 0);

  return {
    batch,
    costPerUnit,
    totalConsumed,
    remainingQuantity: Math.max(batch.quantity - totalConsumed, 0),
    activeCost: totalConsumed * costPerUnit,
    totalOwedToHost,
    members: memberSettlements,
  };
}
