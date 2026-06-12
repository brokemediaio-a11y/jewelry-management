import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { closeSaleSchema } from '@/lib/validations';
import { serializeSale } from '@/lib/sale-utils';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    closeSaleSchema.parse(body);

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { items: { select: { inventoryItemId: true } } },
    });

    if (!sale) {
      return errorResponse('Sale not found', 404);
    }

    if (sale.saleType !== 'CUSTOM_ORDER') {
      return errorResponse('Only custom orders can be closed', 400);
    }

    if (sale.status !== 'OPEN') {
      return errorResponse('Sale is not open', 400);
    }

    const inventoryIds = sale.items.map((i) => i.inventoryItemId);

    const updated = await prisma.$transaction(async (tx) => {
      await tx.inventoryItem.updateMany({
        where: { id: { in: inventoryIds } },
        data: { status: 'SOLD' },
      });

      return tx.sale.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          closedAt: new Date(),
          remainingAmount: 0,
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
    });

    return successResponse(serializeSale(updated as Record<string, unknown>));
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    console.error('Failed to close sale:', error);
    return errorResponse('Failed to close sale', 500);
  }
}
