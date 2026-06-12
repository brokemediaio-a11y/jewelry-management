import { NextRequest } from 'next/server';
import { StoneOptionKind } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { createStoneOptionSchema, paginationSchema, stoneOptionKindSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '100',
    });

    const kindParam = searchParams.get('kind');
    const name = searchParams.get('name');

    const where: {
      kind?: StoneOptionKind;
      name?: { contains: string; mode: 'insensitive' };
    } = {};

    if (kindParam) {
      where.kind = stoneOptionKindSchema.parse(kindParam);
    }

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }

    const skip = (page - 1) * limit;

    const [options, total] = await Promise.all([
      prisma.stoneOption.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      prisma.stoneOption.count({ where }),
    ]);

    const withUsage = await Promise.all(
      options.map(async (option) => {
        const usageCount = await prisma.inventoryItem.count({
          where: {
            OR: [
              { stoneTypeId: option.id },
              { stoneColorId: option.id },
              { stoneCutId: option.id },
              { stoneClarityId: option.id },
            ],
          },
        });
        return { ...option, usageCount };
      })
    );

    return paginatedResponse(withUsage, page, limit, total);
  } catch (error) {
    console.error('Failed to fetch stone options:', error);
    return errorResponse('Failed to fetch stone options', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createStoneOptionSchema.parse(body);

    const option = await prisma.stoneOption.create({
      data: {
        kind: data.kind,
        name: data.name.trim(),
      },
    });

    return successResponse(option, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as { errors?: Array<{ message: string }> };
      return errorResponse(zodError.errors?.[0]?.message || 'Validation error', 400);
    }
    const prismaError = error as { code?: string };
    if (prismaError.code === 'P2002') {
      return errorResponse('An option with this name already exists for this type', 409);
    }
    return errorResponse('Failed to create stone option', 500);
  }
}
