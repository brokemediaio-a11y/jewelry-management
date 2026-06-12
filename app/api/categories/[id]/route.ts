import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateCategorySchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        inventoryItems: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: { inventoryItems: true },
        },
      },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    return successResponse(category);
  } catch (error) {
    return errorResponse('Failed to fetch category', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCategorySchema.parse(body);

    const category = await prisma.category.update({
      where: { id },
      data,
    });

    return successResponse(category);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0].message, 400);
    }
    if (error.code === 'P2025') {
      return errorResponse('Category not found', 404);
    }
    if (error.code === 'P2002') {
      return errorResponse('Category with this name already exists', 409);
    }
    return errorResponse('Failed to update category', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const category = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { inventoryItems: true } } },
    });

    if (!category) {
      return errorResponse('Category not found', 404);
    }

    if (category._count.inventoryItems > 0) {
      return errorResponse('Cannot delete category with associated inventory items', 409);
    }

    await prisma.category.delete({
      where: { id },
    });

    return successResponse({ message: 'Category deleted successfully' });
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Category not found', 404);
    }
    return errorResponse('Failed to delete category', 500);
  }
}

