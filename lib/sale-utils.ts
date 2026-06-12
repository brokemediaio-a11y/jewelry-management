import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { roundPKR } from '@/lib/currency-utils';
import { serializeInventoryItem } from '@/lib/inventory-utils';

export async function generateInvoiceNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const prefix = `INV-${dateStr}-`;

  const lastSale = await prisma.sale.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let sequence = 1;
  if (lastSale?.invoiceNumber) {
    const parts = lastSale.invoiceNumber.split('-');
    const lastSeq = Number.parseInt(parts[2] || '0', 10);
    if (Number.isFinite(lastSeq)) sequence = lastSeq + 1;
  }

  return `${prefix}${String(sequence).padStart(4, '0')}`;
}

type DecimalLike = Prisma.Decimal | number | string;

function toNumber(value: DecimalLike): number {
  return Number(value);
}

export function serializeSaleItem<T extends Record<string, unknown>>(item: T) {
  return {
    ...item,
    weightGrams: toNumber(item.weightGrams as DecimalLike),
    silverRateAtPurchase: toNumber(item.silverRateAtPurchase as DecimalLike),
    purchasePricePerPiece: toNumber(item.purchasePricePerPiece as DecimalLike),
    silverRateAtSale: toNumber(item.silverRateAtSale as DecimalLike),
    categoryQuotient: toNumber(item.categoryQuotient as DecimalLike),
    suggestedSalePrice: toNumber(item.suggestedSalePrice as DecimalLike),
    finalPrice: toNumber(item.finalPrice as DecimalLike),
  };
}

export function serializeSale<T extends Record<string, unknown>>(sale: T) {
  return {
    ...sale,
    suggestedSalePrice: toNumber(sale.suggestedSalePrice as DecimalLike),
    finalPrice: toNumber(sale.finalPrice as DecimalLike),
    silverRateAtSale: toNumber(sale.silverRateAtSale as DecimalLike),
    advancePaid:
      sale.advancePaid != null ? toNumber(sale.advancePaid as DecimalLike) : null,
    remainingAmount:
      sale.remainingAmount != null
        ? toNumber(sale.remainingAmount as DecimalLike)
        : null,
    items: Array.isArray(sale.items)
      ? sale.items.map((item) => {
          const raw = item as Record<string, unknown>;
          const serialized = serializeSaleItem(raw);
          if (raw.inventoryItem) {
            return {
              ...serialized,
              inventoryItem: serializeInventoryItem(
                raw.inventoryItem as Parameters<typeof serializeInventoryItem>[0]
              ),
            };
          }
          return serialized;
        })
      : sale.items,
  };
}

export function computeRemainingAmount(
  finalPrice: number,
  advancePaid: number
): number {
  return roundPKR(finalPrice - advancePaid);
}
