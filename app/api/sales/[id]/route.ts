import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { getShopInfo } from '@/lib/settings-utils';
import { serializeSale } from '@/lib/sale-utils';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const { id } = await params;
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        customer: true,
        user: { select: { id: true, name: true, email: true } },
        workshopOrder: { include: { karegar: { select: { id: true, name: true } } } },
        items: {
          include: {
            inventoryItem: {
              include: { category: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!sale) {
      return errorResponse('Sale not found', 404);
    }

    const shopInfo = await getShopInfo();

    return successResponse({
      ...serializeSale(sale as Record<string, unknown>),
      shopInfo,
    });
  } catch (error) {
    console.error('Failed to fetch sale:', error);
    return errorResponse('Failed to fetch sale', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const { id } = await params;

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: { select: { inventoryItemId: true } } },
    });

    if (!sale) {
      return errorResponse('Sale not found', 404);
    }

    if (sale.status === 'CANCELLED') {
      return errorResponse('Sale is already cancelled', 400);
    }

    const inventoryIds = sale.items
      .map((i) => i.inventoryItemId)
      .filter((invId): invId is string => Boolean(invId));

    await prisma.$transaction([
      prisma.sale.update({
        where: { id },
        data: { status: 'CANCELLED' },
      }),
      ...(inventoryIds.length > 0
        ? [
            prisma.inventoryItem.updateMany({
              where: { id: { in: inventoryIds } },
              data: { status: 'AVAILABLE' },
            }),
          ]
        : []),
    ]);

    return successResponse({ message: 'Sale cancelled successfully' });
  } catch (error) {
    console.error('Failed to cancel sale:', error);
    return errorResponse('Failed to cancel sale', 500);
  }
}
