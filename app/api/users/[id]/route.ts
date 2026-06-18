import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateUserSchema } from '@/lib/validations';
import { hashPassword, requireAdmin } from '@/lib/auth';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        sales: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            suggestedSalePrice: true,
            finalPrice: true,
            saleType: true,
            status: true,
            createdAt: true,
          },
        },
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!user) {
      return errorResponse('User not found', 404);
    }

    return successResponse(user);
  } catch (error) {
    return errorResponse('Failed to fetch user', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await params;
    const body = await request.json();
    const data = updateUserSchema.parse(body);

    const updateData: Prisma.UserUpdateInput = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.email !== undefined) {
      updateData.email = data.email;
    }
    if (data.role !== undefined) {
      updateData.role = data.role;
    }
    if (data.password !== undefined) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(user);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'ZodError') {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || 'Validation error', 400);
    }
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') {
      return errorResponse('User not found', 404);
    }
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2002') {
      return errorResponse('User with this email already exists', 409);
    }
    return errorResponse('Failed to update user', 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const { id } = await params;

    await prisma.user.delete({
      where: { id },
    });

    return successResponse({ message: 'User deleted successfully' });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') {
      return errorResponse('User not found', 404);
    }
    return errorResponse('Failed to delete user', 500);
  }
}

