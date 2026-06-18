import { successResponse, errorResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { formatSaleItemsSummary } from '@/lib/sale-summary-utils';
import { calculateCashInHand } from '@/lib/cash-utils';

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
      monthlyProfitAgg,
      monthlyExternalCostAgg,
      monthlyExpensesAgg,
      cashInHand,
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
      prisma.saleItem.aggregate({
        where: {
          sale: {
            createdAt: { gte: monthStart },
            status: 'COMPLETED',
          },
        },
        _sum: {
          finalPrice: true,
          purchasePricePerPiece: true,
        },
      }),
      prisma.sale.aggregate({
        where: {
          createdAt: { gte: monthStart },
          status: 'COMPLETED',
          source: 'EXTERNAL',
        },
        _sum: { manualCost: true },
      }),
      prisma.expense.aggregate({
        where: { expenseDate: { gte: monthStart } },
        _sum: { amount: true },
      }),
      calculateCashInHand(),
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
          source: true,
          orderDescription: true,
          finalPrice: true,
          createdAt: true,
          customer: { select: { id: true, name: true } },
          _count: { select: { items: true } },
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
        },
      }),
    ]);

    const monthlySaleRevenue = Number(monthlyProfitAgg._sum.finalPrice || 0);
    const monthlyPurchaseCost = Number(
      monthlyProfitAgg._sum.purchasePricePerPiece || 0
    );
    const monthlyExternalCost = Number(monthlyExternalCostAgg._sum.manualCost || 0);
    const monthlyExpenses = Number(monthlyExpensesAgg._sum.amount || 0);

    return successResponse({
      availableInventory,
      monthlySalesCount,
      monthlyRevenue: Number(monthlyRevenueAgg._sum.finalPrice || 0),
      monthlyNetProfit:
        monthlySaleRevenue - monthlyPurchaseCost - monthlyExternalCost - monthlyExpenses,
      cashInHand,
      openCustomOrders,
      recentSales: recentSales.map((sale) => ({
        ...sale,
        finalPrice: Number(sale.finalPrice),
        itemsSummary: formatSaleItemsSummary({
          source: sale.source,
          orderDescription: sale.orderDescription,
          items: sale.items.map((i) => ({
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
    console.error('Failed to fetch dashboard stats:', error);
    return errorResponse('Failed to fetch dashboard stats', 500);
  }
}
