import { Prisma } from '@prisma/client';
import { formatStoneConfiguration } from '@/lib/stone-utils';

type InventoryItemWithCategory = {
  weightGrams: Prisma.Decimal;
  silverRateAtPurchase: Prisma.Decimal;
  purchasePricePerGram: Prisma.Decimal;
  purchasePricePerPiece: Prisma.Decimal;
  stonePrice?: Prisma.Decimal | null;
  stoneType?: { name: string } | null;
  stoneColor?: { name: string } | null;
  stoneCut?: { name: string } | null;
  stoneClarity?: { name: string } | null;
  [key: string]: unknown;
};

export function serializeInventoryItem<T extends InventoryItemWithCategory>(item: T) {
  const stonePrice = item.stonePrice != null ? Number(item.stonePrice) : null;

  return {
    ...item,
    weightGrams: Number(item.weightGrams),
    silverRateAtPurchase: Number(item.silverRateAtPurchase),
    purchasePricePerGram: Number(item.purchasePricePerGram),
    purchasePricePerPiece: Number(item.purchasePricePerPiece),
    stonePrice,
    stoneSummary: formatStoneConfiguration({
      stoneType: item.stoneType,
      stoneColor: item.stoneColor,
      stoneCut: item.stoneCut,
      stoneClarity: item.stoneClarity,
      stonePrice,
    }),
  };
}
