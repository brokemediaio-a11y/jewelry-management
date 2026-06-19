import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { roundPKR, calculatePurchaseTotal } from "@/lib/currency-utils";

export { calculatePurchaseTotal };

export type PurchaseItemInput = {
  categoryId?: string | null;
  categoryName: string;
  totalWeight: number;
  quantity: number;
  costPerGram: number;
};

export type SerializedPurchaseItem = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  totalWeight: number;
  quantity: number;
  costPerGram: number;
  lineTotal: number;
};

type PurchaseWithRelations = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  totalWeight: Prisma.Decimal | number | string;
  quantity: number;
  costPerGram: Prisma.Decimal | number | string;
  totalCost: Prisma.Decimal | number | string;
  purchaseDate: Date;
  notes: string | null;
  items?: Array<{
    id: string;
    categoryId: string | null;
    categoryName: string;
    totalWeight: Prisma.Decimal | number | string;
    quantity: number;
    costPerGram: Prisma.Decimal | number | string;
    lineTotal: Prisma.Decimal | number | string;
  }>;
  allocations?: Array<{ amount: Prisma.Decimal | number | string }>;
};

export function serializePurchaseItems(purchase: PurchaseWithRelations): SerializedPurchaseItem[] {
  if (purchase.items?.length) {
    return purchase.items.map((item) => ({
      id: item.id,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      totalWeight: Number(item.totalWeight),
      quantity: item.quantity,
      costPerGram: Number(item.costPerGram),
      lineTotal: Number(item.lineTotal),
    }));
  }

  return [
    {
      id: purchase.id,
      categoryId: purchase.categoryId,
      categoryName: purchase.categoryName,
      totalWeight: Number(purchase.totalWeight),
      quantity: purchase.quantity,
      costPerGram: Number(purchase.costPerGram),
      lineTotal: Number(purchase.totalCost),
    },
  ];
}

export function aggregatePurchaseItems(items: PurchaseItemInput[]) {
  const normalized = items.map((item) => {
    const lineTotal = calculatePurchaseTotal(item.totalWeight, item.costPerGram);
    return { ...item, lineTotal };
  });

  const totalCost = roundPKR(normalized.reduce((acc, item) => acc + item.lineTotal, 0));
  const totalWeight = normalized.reduce((acc, item) => acc + item.totalWeight, 0);
  const quantity = normalized.reduce((acc, item) => acc + item.quantity, 0);
  const categoryName = normalized.map((item) => item.categoryName.trim()).join(", ");
  const categoryId = normalized.length === 1 ? normalized[0].categoryId ?? null : null;
  const costPerGram =
    totalWeight > 0 ? roundPKR(totalCost / totalWeight) : normalized[0]?.costPerGram ?? 0;

  return {
    normalized,
    totalCost,
    totalWeight,
    quantity,
    categoryName,
    categoryId,
    costPerGram,
  };
}

export function validatePurchaseItems(items: unknown): PurchaseItemInput[] | string {
  if (!Array.isArray(items) || items.length === 0) {
    return "Select at least one category";
  }

  const parsed: PurchaseItemInput[] = [];

  for (const raw of items) {
    const categoryName = String(raw?.categoryName || "").trim();
    const totalWeight = Number(raw?.totalWeight);
    const quantity = Number(raw?.quantity);
    const costPerGram = Number(raw?.costPerGram);
    const categoryId = raw?.categoryId ? String(raw.categoryId) : null;

    if (!categoryName) return "Each selected category must have a name";
    if (!Number.isFinite(totalWeight) || totalWeight <= 0) {
      return `Total weight must be > 0 for ${categoryName}`;
    }
    if (!Number.isFinite(quantity) || quantity < 1) {
      return `Quantity must be >= 1 for ${categoryName}`;
    }
    if (!Number.isFinite(costPerGram) || costPerGram < 0) {
      return `Cost per gram must be >= 0 for ${categoryName}`;
    }

    parsed.push({ categoryId, categoryName, totalWeight, quantity, costPerGram });
  }

  return parsed;
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
      purchases: { include: { allocations: { select: { amount: true } }, items: true } },
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
    const items = serializePurchaseItems(p);
    return {
      ...p,
      totalWeight: Number(p.totalWeight),
      costPerGram: Number(p.costPerGram),
      totalCost: Number(p.totalCost),
      paidAmount: pPaid,
      remainingAmount,
      items,
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
