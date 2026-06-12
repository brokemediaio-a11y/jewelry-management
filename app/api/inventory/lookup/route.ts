import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { getCurrentSilverRate } from '@/lib/silver-rate-service';
import { calculateItemSuggestedPrice } from '@/lib/pricing-engine';
import { getPricingConfig } from '@/lib/settings-utils';
import { serializeInventoryItem } from '@/lib/inventory-utils';

export async function GET(request: NextRequest) {
  try {
    const sku = request.nextUrl.searchParams.get('sku');
    const barcode = request.nextUrl.searchParams.get('barcode');

    if (!sku && !barcode) {
      return errorResponse('SKU or barcode is required', 400);
    }

    const item = await prisma.inventoryItem.findFirst({
      where: sku ? { sku } : { barcode: barcode! },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!item) {
      return errorResponse('Item not found', 404);
    }

    if (item.status === 'SOLD') {
      return errorResponse('This item has already been sold', 409);
    }

    if (item.status === 'RESERVED') {
      return errorResponse('This item is reserved for a custom order', 409);
    }

    const [{ ratePerGram }, pricingConfig] = await Promise.all([
      getCurrentSilverRate(),
      getPricingConfig(),
    ]);
    const suggestedSalePrice = calculateItemSuggestedPrice(
      {
        todaySilverRate: ratePerGram,
        weightGrams: Number(item.weightGrams),
        purchasePricePerPiece: Number(item.purchasePricePerPiece),
        categoryName: item.category.name,
      },
      pricingConfig
    );

    return successResponse({
      ...serializeInventoryItem(item),
      silverRateAtSale: ratePerGram,
      suggestedSalePrice,
    });
  } catch (error) {
    console.error('Failed to lookup inventory item:', error);
    return errorResponse('Failed to lookup inventory item', 500);
  }
}
