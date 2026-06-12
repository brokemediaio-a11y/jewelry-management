import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import {
  successResponse,
  errorResponse,
  paginatedResponse,
} from '@/lib/api-response';
import { z } from 'zod';
import { createSaleSchema, paginationSchema } from '@/lib/validations';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getCurrentSilverRate } from '@/lib/silver-rate-service';
import {
  calculateItemSuggestedPrice,
  calculateFinalTotal,
  calculateSuggestedTotal,
  getCategoryQuotient,
} from '@/lib/pricing-engine';
import { getPricingConfig } from '@/lib/settings-utils';
import { roundPKR } from '@/lib/currency-utils';
import {
  generateInvoiceNumber,
  serializeSale,
  computeRemainingAmount,
} from '@/lib/sale-utils';

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (page - 1) * limit;
    const saleType = searchParams.get('saleType');
    const status = searchParams.get('status');
    const customerId = searchParams.get('customerId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const where: Prisma.SaleWhereInput = {};

    if (saleType) where.saleType = saleType as Prisma.EnumSaleTypeFilter['equals'];
    if (status) where.status = status as Prisma.EnumSaleStatusFilter['equals'];
    if (customerId) where.customerId = customerId;
    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    const [sales, total] = await Promise.all([
      prisma.sale.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, phone: true } },
          user: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
      prisma.sale.count({ where }),
    ]);

    const data = sales.map((sale) => serializeSale(sale as Record<string, unknown>));

    return paginatedResponse(data, page, limit, total);
  } catch (error) {
    console.error('Failed to fetch sales:', error);
    return errorResponse('Failed to fetch sales', 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const body = await request.json();
    const data = createSaleSchema.parse(body);

    const inventoryIds = data.items.map((i) => i.inventoryItemId);
    const uniqueIds = new Set(inventoryIds);
    if (uniqueIds.size !== inventoryIds.length) {
      return errorResponse('Duplicate items in sale', 400);
    }

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { id: { in: inventoryIds } },
      include: { category: { select: { name: true } } },
    });

    if (inventoryItems.length !== inventoryIds.length) {
      return errorResponse('One or more inventory items not found', 404);
    }

    for (const item of inventoryItems) {
      if (item.status !== 'AVAILABLE') {
        return errorResponse(
          `Item ${item.sku} is not available (${item.status})`,
          409
        );
      }
    }

    const [{ ratePerGram }, pricingConfig] = await Promise.all([
      getCurrentSilverRate(),
      getPricingConfig(),
    ]);
    const silverRateAtSale = ratePerGram;

    const pricedItems = data.items.map((input) => {
      const inv = inventoryItems.find((i) => i.id === input.inventoryItemId)!;
      const weightGrams = Number(inv.weightGrams);
      const purchasePricePerPiece = Number(inv.purchasePricePerPiece);
      const categoryName = inv.category.name;
      const categoryQuotient = getCategoryQuotient(categoryName, pricingConfig);
      const suggestedSalePrice = calculateItemSuggestedPrice(
        {
          todaySilverRate: silverRateAtSale,
          weightGrams,
          purchasePricePerPiece,
          categoryName,
        },
        pricingConfig
      );
      const finalPrice = roundPKR(Number(input.finalPrice));

      if (finalPrice <= 0) {
        throw new Error(`Final price must be positive for ${inv.sku}`);
      }

      return {
        inventoryItemId: inv.id,
        weightGrams,
        silverRateAtPurchase: Number(inv.silverRateAtPurchase),
        purchasePricePerPiece,
        silverRateAtSale,
        categoryQuotient,
        suggestedSalePrice,
        finalPrice,
      };
    });

    const suggestedSalePrice = calculateSuggestedTotal(pricedItems);
    const finalPrice = calculateFinalTotal(pricedItems);

    let advancePaid: number | null = null;
    let remainingAmount: number | null = null;
    let pickupDate: Date | null = null;
    let status: 'COMPLETED' | 'OPEN' = 'COMPLETED';
    let inventoryStatus: 'SOLD' | 'RESERVED' = 'SOLD';

    if (data.saleType === 'CUSTOM_ORDER') {
      if (!data.pickupDate) {
        return errorResponse('Pickup date is required for custom orders', 400);
      }
      const advance = Number(data.advancePaid);
      if (!advance || advance <= 0) {
        return errorResponse('Advance paid must be greater than zero', 400);
      }
      if (advance >= finalPrice) {
        return errorResponse('Advance paid must be less than final total', 400);
      }
      advancePaid = roundPKR(advance);
      remainingAmount = computeRemainingAmount(finalPrice, advancePaid);
      pickupDate = new Date(data.pickupDate);
      status = 'OPEN';
      inventoryStatus = 'RESERVED';
    }

    const invoiceNumber = await generateInvoiceNumber();

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          invoiceNumber,
          saleType: data.saleType,
          status,
          customerId: data.customerId,
          userId: auth.session.id,
          suggestedSalePrice: new Prisma.Decimal(suggestedSalePrice),
          finalPrice: new Prisma.Decimal(finalPrice),
          silverRateAtSale: new Prisma.Decimal(silverRateAtSale),
          advancePaid:
            advancePaid != null ? new Prisma.Decimal(advancePaid) : null,
          remainingAmount:
            remainingAmount != null ? new Prisma.Decimal(remainingAmount) : null,
          pickupDate,
          paymentMethod: data.paymentMethod,
          notes: data.notes || null,
          items: {
            create: pricedItems.map((item) => ({
              inventoryItemId: item.inventoryItemId,
              weightGrams: new Prisma.Decimal(item.weightGrams),
              silverRateAtPurchase: new Prisma.Decimal(item.silverRateAtPurchase),
              purchasePricePerPiece: new Prisma.Decimal(item.purchasePricePerPiece),
              silverRateAtSale: new Prisma.Decimal(item.silverRateAtSale),
              categoryQuotient: new Prisma.Decimal(item.categoryQuotient),
              suggestedSalePrice: new Prisma.Decimal(item.suggestedSalePrice),
              finalPrice: new Prisma.Decimal(item.finalPrice),
            })),
          },
        },
        include: {
          customer: true,
          user: { select: { id: true, name: true, email: true } },
          items: {
            include: {
              inventoryItem: {
                include: { category: { select: { id: true, name: true } } },
              },
            },
          },
        },
      });

      await tx.inventoryItem.updateMany({
        where: { id: { in: inventoryIds } },
        data: { status: inventoryStatus },
      });

      return created;
    });

    return successResponse(serializeSale(sale as Record<string, unknown>), 201);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      return errorResponse(error.issues[0]?.message || 'Validation error', 400);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    console.error('Failed to create sale:', error);
    return errorResponse('Failed to create sale', 500);
  }
}
