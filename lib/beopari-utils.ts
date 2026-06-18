import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundPKR } from "@/lib/currency-utils";

export function calculatePurchaseTotal(totalWeight: number, costPerGram: number): number {
  return roundPKR(totalWeight * costPerGram);
}

export function toNumberDecimal(v: Prisma.Decimal | number | string | null | undefined): number {
  if (v == null) return 0;
  return Number(v);
}

export function getPurchasePaidRemaining(
  totalCost: number,
  allocations: Array<{ amount: Prisma.Decimal | number | string }>
) {
  const paidAmount = allocations.reduce((acc, a) => acc + Number(a.amount), 0);
  const remainingAmount = totalCost - paidAmount;
  return { paidAmount, remainingAmount };
}

export async function aggregateBeopariLedger(beopariId: string) {
  const beopari = await prisma.beopari.findUnique({
    where: { id: beopariId },
    include: {
      purchases: { include: { allocations: { select: { amount: true } } } },
      expenses: {
        include: { beopariAllocations: { select: { amount: true, beopariPurchaseId: true } } },
      },
    },
  });

  if (!beopari) return null;

  const totalAmount = beopari.purchases.reduce((acc, p) => acc + Number(p.totalCost), 0);
  const paidAmount = beopari.expenses.reduce(
    (acc, e) => acc + e.beopariAllocations.reduce((a2, a) => a2 + Number(a.amount), 0),
    0
  );

  const purchases = beopari.purchases.map((p) => {
    const { paidAmount: pPaid, remainingAmount } = getPurchasePaidRemaining(
      Number(p.totalCost),
      p.allocations
    );
    return {
      ...p,
      totalWeight: Number(p.totalWeight),
      costPerGram: Number(p.costPerGram),
      totalCost: Number(p.totalCost),
      paidAmount: pPaid,
      remainingAmount,
    };
  });

  return {
    ...beopari,
    totalAmount,
    paidAmount,
    remainingAmount: totalAmount - paidAmount,
    purchases,
    paymentHistory: beopari.expenses
      .map((e) => ({
        id: e.id,
        expenseDate: e.expenseDate,
        amount: Number(e.amount),
        paymentMethod: e.paymentMethod,
        description: e.description,
        allocations: e.beopariAllocations.map((a) => ({
          amount: Number(a.amount),
          beopariPurchaseId: a.beopariPurchaseId,
        })),
      }))
      .sort((a, b) => b.expenseDate.getTime() - a.expenseDate.getTime()),
  };
}
