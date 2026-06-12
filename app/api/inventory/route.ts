import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { createInventorySchema, paginationSchema } from '@/lib/validations';
import { validateImageBase64 } from '@/lib/image-utils';
import { generateSkuBatch } from '@/lib/sku-generator';
import { roundPKR } from '@/lib/currency-utils';
import { serializeInventoryItem } from '@/lib/inventory-utils';
import { inventoryStoneInclude } from '@/lib/stone-utils';
import { buildInventoryStoneCreateData } from '@/lib/inventory-stone-data';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (page - 1) * limit;
    const categoryId = searchParams.get('categoryId');
    const status = searchParams.get('status');
    const sku = searchParams.get('sku');
    const barcode = searchParams.get('barcode');

    const where: Prisma.InventoryItemWhereInput = {};

    if (categoryId) where.categoryId = categoryId;
    if (status) where.status = status as Prisma.EnumInventoryStatusFilter['equals'];
    if (sku) where.sku = { contains: sku, mode: 'insensitive' };
    if (barcode) where.barcode = { contains: barcode, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.inventoryItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: { select: { id: true, name: true } },
          ...inventoryStoneInclude,
        },
      }),
      prisma.inventoryItem.count({ where }),
    ]);

    const data = items.map((item) => serializeInventoryItem(item));

    return paginatedResponse(data, page, limit, total);
  } catch (error) {
    console.error('Failed to fetch inventory:', error);
    return errorResponse('Failed to fetch inventory', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createInventorySchema.parse(body);

    validateImageBase64(data.imageData, data.imageMimeType);

    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    const weightGrams = Number(data.weightGrams);
    const purchasePricePerGram = Number(data.purchasePricePerGram);
    const purchasePricePerPiece = roundPKR(purchasePricePerGram * weightGrams);
    const quantity = Number(data.quantity);

    const skus = await generateSkuBatch(category.name, quantity);
    const stoneData = buildInventoryStoneCreateData(data);

    const createdItems = await prisma.$transaction(
      skus.map((sku) =>
        prisma.inventoryItem.create({
          data: {
            sku,
            barcode: sku,
            categoryId: data.categoryId,
            imageData: data.imageData,
            imageMimeType: data.imageMimeType,
            weightGrams: new Prisma.Decimal(weightGrams),
            ...stoneData,
            silverRateAtPurchase: new Prisma.Decimal(Number(data.silverRateAtPurchase)),
            purchasePricePerGram: new Prisma.Decimal(purchasePricePerGram),
            purchasePricePerPiece: new Prisma.Decimal(purchasePricePerPiece),
            status: 'AVAILABLE',
          },
          select: {
            id: true,
            sku: true,
            barcode: true,
            categoryId: true,
            status: true,
            createdAt: true,
          },
        })
      )
    );

    return successResponse(
      {
        created: createdItems.length,
        items: createdItems,
      },
      201
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    console.error('Failed to create inventory:', error);
    return errorResponse('Failed to create inventory', 500);
  }
}
