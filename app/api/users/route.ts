import { NextRequest } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { createUserSchema, paginationSchema } from '@/lib/validations';
import { hashPassword, requireAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (page - 1) * limit;
    const name = searchParams.get('name');
    const email = searchParams.get('email');
    const role = searchParams.get('role') as 'ADMIN' | 'STAFF' | 'CLERK' | 'ACCOUNTANT' | null;

    const where: Prisma.UserWhereInput = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }
    if (role) {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: { sales: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return paginatedResponse(users, page, limit, total);
  } catch (error) {
    return errorResponse('Failed to fetch users', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAdmin();
    if ('error' in auth) {
      return errorResponse(auth.error, auth.status);
    }

    const body = await request.json();
    const data = createUserSchema.parse(body);

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return successResponse(user, 201);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'ZodError') {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || 'Validation error', 400);
    }
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2002') {
      return errorResponse('User with this email already exists', 409);
    }
    return errorResponse('Failed to create user', 500);
  }
}

