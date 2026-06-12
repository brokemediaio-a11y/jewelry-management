import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse, paginatedResponse } from '@/lib/api-response';
import { createCustomerSchema, paginationSchema } from '@/lib/validations';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });

    const skip = (page - 1) * limit;
    const name = searchParams.get('name');
    const phone = searchParams.get('phone');
    const email = searchParams.get('email');

    const where: any = {};

    if (name) {
      where.name = { contains: name, mode: 'insensitive' };
    }
    if (phone) {
      where.phone = { contains: phone };
    }
    if (email) {
      where.email = { contains: email, mode: 'insensitive' };
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { sales: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    return paginatedResponse(customers, page, limit, total);
  } catch (error) {
    return errorResponse('Failed to fetch customers', 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const data = createCustomerSchema.parse(body);

    const customer = await prisma.customer.create({
      data,
    });

    return successResponse(customer, 201);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0].message, 400);
    }
    return errorResponse('Failed to create customer', 500);
  }
}

