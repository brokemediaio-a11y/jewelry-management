import { ExpenseType, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundPKR } from "@/lib/currency-utils";

export function assertExpenseDescriptionRequired(input: {
  expenseType: ExpenseType;
  description?: string | null;
}) {
  if (input.expenseType === "SHOP" || input.expenseType === "HOME") {
    const desc = (input.description || "").trim();
    if (desc.length < 10) {
      throw new Error("Description is required (min 10 characters)");
    }
  }
}

export function sumDecimalLike(values: Array<Prisma.Decimal | number | string>) {
  return values.reduce((acc: number, v) => acc + Number(v), 0);
}

export function validateAllocationsSumToAmount(
  allocations: Array<{ amount: number }>,
  expenseAmount: number
) {
  const sum = allocations.reduce((acc, a) => acc + Number(a.amount || 0), 0);
  if (Math.abs(sum - expenseAmount) > 0.009) {
    throw new Error("Allocations total must equal expense amount");
  }
}

export async function validateBeopariAllocations(
  allocations: Array<{ targetId: string; amount: number }>,
  beopariId: string
) {
  for (const alloc of allocations) {
    const purchase = await prisma.beopariPurchase.findFirst({
      where: { id: alloc.targetId, beopariId },
      include: { allocations: { select: { amount: true } } },
    });
    if (!purchase) {
      throw new Error("Invalid beopari purchase selected");
    }
    const paid = purchase.allocations.reduce((acc, a) => acc + Number(a.amount), 0);
    const remaining = Number(purchase.totalCost) - paid;
    const allocAmount = roundPKR(Number(alloc.amount));
    if (allocAmount > remaining + 0.009) {
      throw new Error(
        `Allocation for ${purchase.categoryName} exceeds remaining (${remaining.toFixed(2)} PKR)`
      );
    }
  }
}

export async function getKaregarPaidTotals(karegarId: string) {
  const expenses = await prisma.expense.findMany({
    where: { karegarId, expenseType: "KAREGAR" },
    include: { workshopAllocations: { select: { amount: true } } },
  });

  const allTime = expenses.reduce(
    (acc, e) => acc + e.workshopAllocations.reduce((a2, a) => a2 + Number(a.amount), 0),
    0
  );

  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const thisMonth = expenses
    .filter((e) => e.expenseDate >= monthStart)
    .reduce(
      (acc, e) => acc + e.workshopAllocations.reduce((a2, a) => a2 + Number(a.amount), 0),
      0
    );

  return { allTime, thisMonth };
}
