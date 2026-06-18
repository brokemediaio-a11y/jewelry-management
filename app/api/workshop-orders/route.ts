import { NextRequest } from "next/server";
import { Prisma, WorkshopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, paginatedResponse } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";
import { formatSaleItemsSummary } from "@/lib/sale-summary-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });

    const status = searchParams.get("status") as WorkshopOrderStatus | null;
    const karegarId = searchParams.get("karegarId");
    const skip = (page - 1) * limit;

    const where: Prisma.WorkshopOrderWhereInput = {};
    if (status) where.status = status;
    if (karegarId) where.karegarId = karegarId;

    const [rows, total] = await Promise.all([
      prisma.workshopOrder.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          karegar: { select: { id: true, name: true } },
          sale: {
            include: {
              customer: { select: { id: true, name: true } },
              items: {
                select: {
                  categoryName: true,
                  stoneTypeName: true,
                  stoneColorName: true,
                  stoneCutName: true,
                  stoneClarityName: true,
                  stonePrice: true,
                  inventoryItem: { select: { category: { select: { name: true } } } },
                },
              },
            },
          },
          allocations: { select: { amount: true } },
        },
      }),
      prisma.workshopOrder.count({ where }),
    ]);

    const data = rows.map((o) => {
      const paidAmount = o.allocations.reduce((acc, a) => acc + Number(a.amount), 0);
      return {
        id: o.id,
        status: o.status,
        assignedAt: o.assignedAt,
        completedAt: o.completedAt,
        createdAt: o.createdAt,
        karegar: o.karegar,
        sale: {
          id: o.sale.id,
          invoiceNumber: o.sale.invoiceNumber,
          source: o.sale.source,
          saleType: o.sale.saleType,
          status: o.sale.status,
          createdAt: o.sale.createdAt,
          pickupDate: o.sale.pickupDate,
          customer: o.sale.customer,
          itemsSummary: formatSaleItemsSummary({
            source: o.sale.source,
            orderDescription: o.sale.orderDescription,
            items: o.sale.items.map((i) => ({
              categoryName: i.categoryName,
              inventoryItem: i.inventoryItem,
              stoneTypeName: i.stoneTypeName,
              stoneColorName: i.stoneColorName,
              stoneCutName: i.stoneCutName,
              stoneClarityName: i.stoneClarityName,
              stonePrice: i.stonePrice != null ? Number(i.stonePrice) : null,
            })),
          }),
        },
        paidAmount,
      };
    });

    return paginatedResponse(data, page, limit, total);
  } catch (err) {
    console.error("Failed to fetch workshop orders:", err);
    return errorResponse("Failed to fetch workshop orders", 500);
  }
}

