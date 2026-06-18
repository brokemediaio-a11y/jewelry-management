import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { createCategorySchema, paginationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (page - 1) * limit;
    const name = searchParams.get('name');

    const where = name
      ? {
          name: {
            contains: name,
            mode: 'insensitive' as const,
          },
        }
      : {};

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { inventoryItems: true },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    return paginatedResponse(categories, page, limit, total);
  } catch (error) {
    return errorResponse('Failed to fetch categories', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCategorySchema.parse(body);

    const category = await prisma.category.create({
      data,
    });

    return successResponse(category, 201);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'ZodError') {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || 'Validation error', 400);
    }
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2002') {
      return errorResponse('Category with this name already exists', 409);
    }
    return errorResponse('Failed to create category', 500);
  }
}

