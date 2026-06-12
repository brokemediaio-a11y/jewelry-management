import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateInventorySchema } from '@/lib/validations';
import { validateImageBase64 } from '@/lib/image-utils';
import { roundPKR } from '@/lib/currency-utils';
import { serializeInventoryItem } from '@/lib/inventory-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const item = await prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true } },
        saleItems: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sale: {
              select: {
                id: true,
                invoiceNumber: true,
                status: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    if (!item) {
      return errorResponse('Inventory item not found', 404);
    }

    return successResponse(serializeInventoryItem(item));
  } catch (error) {
    console.error('Failed to fetch inventory item:', error);
    return errorResponse('Failed to fetch inventory item', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('Inventory item not found', 404);
    }

    if (existing.status !== 'AVAILABLE') {
      return errorResponse('Only available items can be edited', 409);
    }

    const body = await request.json();
    const data = updateInventorySchema.parse(body);

    if (data.imageData && data.imageMimeType) {
      validateImageBase64(data.imageData, data.imageMimeType);
    }

    const weightGrams =
      data.weightGrams !== undefined ? Number(data.weightGrams) : Number(existing.weightGrams);
    const purchasePricePerGram =
      data.purchasePricePerGram !== undefined
        ? Number(data.purchasePricePerGram)
        : Number(existing.purchasePricePerGram);

    const updateData: Prisma.InventoryItemUpdateInput = {};

    if (data.imageData) updateData.imageData = data.imageData;
    if (data.imageMimeType) updateData.imageMimeType = data.imageMimeType;
    if (data.categoryId) updateData.category = { connect: { id: data.categoryId } };
    if (data.weightGrams !== undefined) updateData.weightGrams = new Prisma.Decimal(weightGrams);
    if (data.silverRateAtPurchase !== undefined) {
      updateData.silverRateAtPurchase = new Prisma.Decimal(Number(data.silverRateAtPurchase));
    }
    if (data.hasStone !== undefined) {
      updateData.hasStone = data.hasStone;
      updateData.stoneType = data.hasStone ? data.stoneType || null : null;
      updateData.stoneDetails = data.hasStone ? data.stoneDetails || null : null;
    } else if (data.stoneType !== undefined || data.stoneDetails !== undefined) {
      updateData.stoneType = data.stoneType;
      updateData.stoneDetails = data.stoneDetails;
    }
    if (data.purchasePricePerGram !== undefined) {
      updateData.purchasePricePerGram = new Prisma.Decimal(purchasePricePerGram);
    }

    if (data.weightGrams !== undefined || data.purchasePricePerGram !== undefined) {
      updateData.purchasePricePerPiece = new Prisma.Decimal(
        roundPKR(purchasePricePerGram * weightGrams)
      );
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    return successResponse(serializeInventoryItem(item));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    if (error instanceof Error) {
      return errorResponse(error.message, 400);
    }
    console.error('Failed to update inventory item:', error);
    return errorResponse('Failed to update inventory item', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await prisma.inventoryItem.findUnique({ where: { id } });

    if (!existing) {
      return errorResponse('Inventory item not found', 404);
    }

    if (existing.status !== 'AVAILABLE') {
      return errorResponse('Only available items can be deleted', 409);
    }

    await prisma.inventoryItem.delete({ where: { id } });

    return successResponse({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Failed to delete inventory item:', error);
    return errorResponse('Failed to delete inventory item', 500);
  }
}
