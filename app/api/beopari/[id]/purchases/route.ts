import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";
import {
  aggregatePurchaseItems,
  getPurchasePaidRemaining,
  serializePurchaseItems,
  validatePurchaseItems,
} from "@/lib/beopari-utils";
import { roundPKR } from "@/lib/currency-utils";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;
    const onlyOpen = searchParams.get("onlyOpen") === "1";
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });
    const skip = (page - 1) * limit;

    const where: Prisma.BeopariPurchaseWhereInput = { beopariId: id };

    const [rows, total] = await Promise.all([
      prisma.beopariPurchase.findMany({
        where,
        skip,
        take: limit,
        orderBy: { purchaseDate: "desc" },
        include: {
          allocations: { select: { amount: true } },
          items: { orderBy: { categoryName: "asc" } },
        },
      }),
      prisma.beopariPurchase.count({ where }),
    ]);

    const data = rows
      .map((p) => {
        const paidAmount = p.allocations.reduce((acc, a) => acc + Number(a.amount), 0);
        const remainingAmount = Number(p.totalCost) - paidAmount;
        return {
          ...p,
          totalWeight: Number(p.totalWeight),
          costPerGram: Number(p.costPerGram),
          totalCost: Number(p.totalCost),
          paidAmount,
          remainingAmount,
          items: serializePurchaseItems(p),
        };
      })
      .filter((p) => (onlyOpen ? p.remainingAmount > 0.009 : true));

    return paginatedResponse(data, page, limit, total);
  } catch (err) {
    console.error("Failed to fetch purchases:", err);
    return errorResponse("Failed to fetch purchases", 500);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id: beopariId } = await params;
    const body = await request.json();

    const purchaseDate = body?.purchaseDate ? new Date(body.purchaseDate) : new Date();
    const notes = body?.notes ? String(body.notes) : null;

    let parsedItems = validatePurchaseItems(body?.items);

    if (typeof parsedItems === "string" && body?.categoryName) {
      parsedItems = validatePurchaseItems([
        {
          categoryId: body?.categoryId ? String(body.categoryId) : null,
          categoryName: String(body.categoryName),
          totalWeight: Number(body?.totalWeight),
          quantity: Number(body?.quantity),
          costPerGram: Number(body?.costPerGram),
        },
      ]);
    }

    if (typeof parsedItems === "string") return errorResponse(parsedItems, 400);

    const { normalized, totalCost, totalWeight, quantity, categoryName, categoryId, costPerGram } =
      aggregatePurchaseItems(parsedItems);

    const created = await prisma.beopariPurchase.create({
      data: {
        beopariId,
        categoryId,
        categoryName,
        totalWeight: new Prisma.Decimal(totalWeight),
        quantity,
        costPerGram: new Prisma.Decimal(roundPKR(costPerGram)),
        totalCost: new Prisma.Decimal(totalCost),
        purchaseDate,
        notes,
        items: {
          create: normalized.map((item) => ({
            categoryId: item.categoryId ?? null,
            categoryName: item.categoryName,
            totalWeight: new Prisma.Decimal(item.totalWeight),
            quantity: item.quantity,
            costPerGram: new Prisma.Decimal(roundPKR(item.costPerGram)),
            lineTotal: new Prisma.Decimal(item.lineTotal),
          })),
        },
      },
      include: { items: true },
    });

    const { paidAmount, remainingAmount } = getPurchasePaidRemaining(
      Number(created.totalCost),
      []
    );

    return successResponse(
      {
        ...created,
        totalWeight: Number(created.totalWeight),
        costPerGram: Number(created.costPerGram),
        totalCost: Number(created.totalCost),
        paidAmount,
        remainingAmount,
        items: serializePurchaseItems(created),
      },
      201
    );
  } catch (err) {
    console.error("Failed to create purchase:", err);
    return errorResponse("Failed to create purchase", 500);
  }
}
