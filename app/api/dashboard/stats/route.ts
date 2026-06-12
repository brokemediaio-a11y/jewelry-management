import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';

function getMonthStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

export async function GET() {
  const auth = await requireAuth();
  if ('error' in auth) {
    return errorResponse(auth.error, auth.status);
  }

  try {
    const monthStart = getMonthStart();

    const [
      availableInventory,
      monthlySalesCount,
      monthlyRevenueAgg,
      openCustomOrders,
      recentSales,
    ] = await Promise.all([
      prisma.inventoryItem.count({ where: { status: 'AVAILABLE' } }),
      prisma.sale.count({
        where: {
          createdAt: { gte: monthStart },
          status: { not: 'CANCELLED' },
        },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: 'COMPLETED',
        },
        _sum: { finalPrice: true },
      }),
      prisma.sale.count({
        where: {
          status: 'OPEN',
          saleType: 'CUSTOM_ORDER',
        },
      }),
      prisma.sale.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        where: { status: { not: 'CANCELLED' } },
        select: {
          id: true,
          invoiceNumber: true,
          saleType: true,
          status: true,
          finalPrice: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
      }),
    ]);

    return successResponse({
      availableInventory,
      monthlySalesCount,
      monthlyRevenue: Number(monthlyRevenueAgg._sum.finalPrice || 0),
      openCustomOrders,
      recentSales: recentSales.map((sale) => ({
        ...sale,
        finalPrice: Number(sale.finalPrice),
      })),
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return errorResponse('Failed to fetch dashboard stats', 500);
  }
}
