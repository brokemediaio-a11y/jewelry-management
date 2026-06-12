import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { successResponse, errorResponse } from '@/lib/api-response';
import { updateCustomerSchema } from '@/lib/validations';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
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
            paymentMethod: true,
            createdAt: true,
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

    return successResponse(customer);
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
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return errorResponse(error.errors[0].message, 400);
    }
    if (error.code === 'P2025') {
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
  } catch (error: any) {
    if (error.code === 'P2025') {
      return errorResponse('Customer not found', 404);
    }
    return errorResponse('Failed to delete customer', 500);
  }
}

