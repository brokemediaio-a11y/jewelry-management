import { prisma } from './prisma';
import { formatDateForSku, generateSKU, getCategoryCode } from './sku-utils';

export { formatDateForSku, generateSKU, getCategoryCode } from './sku-utils';

export async function getNextSequence(categoryName: string, date = new Date()): Promise<number> {
  const categoryCode = getCategoryCode(categoryName);
  const datePart = formatDateForSku(date);
  const prefix = `${categoryCode}-${datePart}-`;

  const latest = await prisma.inventoryItem.findFirst({
    where: { sku: { startsWith: prefix } },
    orderBy: { sku: 'desc' },
    select: { sku: true },
  });

  if (!latest) return 1;

  const lastSeq = Number.parseInt(latest.sku.split('-')[2] || '0', 10);
  return Number.isFinite(lastSeq) ? lastSeq + 1 : 1;
}

export async function generateSkuBatch(
  categoryName: string,
  quantity: number,
  date = new Date()
): Promise<string[]> {
  const startSequence = await getNextSequence(categoryName, date);
  return Array.from({ length: quantity }, (_, index) =>
    generateSKU(categoryName, startSequence + index, date)
  );
}
