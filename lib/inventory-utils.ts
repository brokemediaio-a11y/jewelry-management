import { Prisma } from '@prisma/client';

type InventoryItemWithCategory = {
  weightGrams: Prisma.Decimal;
  silverRateAtPurchase: Prisma.Decimal;
  purchasePricePerGram: Prisma.Decimal;
  purchasePricePerPiece: Prisma.Decimal;
  [key: string]: unknown;
};

export function serializeInventoryItem<T extends InventoryItemWithCategory>(item: T) {
  return {
    ...item,
    weightGrams: Number(item.weightGrams),
    silverRateAtPurchase: Number(item.silverRateAtPurchase),
    purchasePricePerGram: Number(item.purchasePricePerGram),
    purchasePricePerPiece: Number(item.purchasePricePerPiece),
  };
}
