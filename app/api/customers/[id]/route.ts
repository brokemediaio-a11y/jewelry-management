import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateCustomerSchema } from '@/lib/validations';
import { paginationSchema } from '@/lib/validations';
import { requireAuth } from '@/lib/auth';
import { formatSaleItemsSummary } from '@/lib/sale-summary-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const { id } = await params;

    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '10',
    });
    const skip = (page - 1) * limit;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            invoiceNumber: true,
            suggestedSalePrice: true,
            finalPrice: true,
            saleType: true,
            source: true,
            status: true,
            paymentMethod: true,
            advancePaid: true,
            createdAt: true,
            orderDescription: true,
            items: {
              select: {
                categoryName: true,
                stoneTypeName: true,
                stoneColorName: true,
                stoneCutName: true,
                stoneClarityName: true,
                stonePrice: true,
                inventoryItem: {
                  select: {
                    category: { select: { name: true } },
                  },
                },
              },
            },
            workshopOrder: { select: { id: true, status: true, karegarId: true } },
          },
        },
        _count: {
          select: { sales: true },
        },
      },
    });

    if (!customer) {
      return errorResponse('Customer not found', 404);
    }

    return successResponse({
      ...customer,
      sales: customer.sales.map((s) => ({
        ...s,
        suggestedSalePrice: Number(s.suggestedSalePrice),
        finalPrice: Number(s.finalPrice),
        advancePaid: s.advancePaid != null ? Number(s.advancePaid) : null,
        itemsSummary: formatSaleItemsSummary({
          source: s.source,
          orderDescription: s.orderDescription,
          items: s.items.map((i) => ({
            categoryName: i.categoryName,
            inventoryItem: i.inventoryItem,
            stoneTypeName: i.stoneTypeName,
            stoneColorName: i.stoneColorName,
            stoneCutName: i.stoneCutName,
            stoneClarityName: i.stoneClarityName,
            stonePrice: i.stonePrice != null ? Number(i.stonePrice) : null,
          })),
        }),
      })),
    });
  } catch (error) {
    return errorResponse('Failed to fetch customer', 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const data = updateCustomerSchema.parse(body);

    const customer = await prisma.customer.update({
      where: { id },
      data,
    });

    return successResponse(customer);
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { name?: string }).name === 'ZodError') {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || 'Validation error', 400);
    }
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') {
      return errorResponse('Customer not found', 404);
    }
    return errorResponse('Failed to update customer', 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await prisma.customer.delete({
      where: { id },
    });

    return successResponse({ message: 'Customer deleted successfully' });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && (error as { code?: string }).code === 'P2025') {
      return errorResponse('Customer not found', 404);
    }
    return errorResponse('Failed to delete customer', 500);
  }
}

