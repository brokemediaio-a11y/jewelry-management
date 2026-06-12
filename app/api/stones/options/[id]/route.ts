import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateStoneOptionSchema } from '@/lib/validations';

async function getUsageCount(id: string): Promise<number> {
  return prisma.inventoryItem.count({
    where: {
      OR: [
        { stoneTypeId: id },
        { stoneColorId: id },
        { stoneCutId: id },
        { stoneClarityId: id },
      ],
    },
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateStoneOptionSchema.parse(body);

    const option = await prisma.stoneOption.update({
      where: { id },
      data: { name: data.name?.trim() },
    });

    return successResponse(option);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return errorResponse('Stone option not found', 404);
    }
    if (prismaError.code === 'P2002') {
      return errorResponse('An option with this name already exists for this type', 409);
    }
    return errorResponse('Failed to update stone option', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const option = await prisma.stoneOption.findUnique({ where: { id } });
    if (!option) {
      return errorResponse('Stone option not found', 404);
    }

    const usageCount = await getUsageCount(id);
    if (usageCount > 0) {
      return errorResponse(
        'Cannot delete stone option used by inventory items',
        409
      );
    }

    await prisma.stoneOption.delete({ where: { id } });

    return successResponse({ message: 'Stone option deleted successfully' });
  } catch (error: unknown) {
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2025') {
      return errorResponse('Stone option not found', 404);
    }
    return errorResponse('Failed to delete stone option', 500);
  }
}
