import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";
import { calculatePurchaseTotal } from "@/lib/beopari-utils";
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
        include: { allocations: { select: { amount: true } } },
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

    const categoryId = body?.categoryId ? String(body.categoryId) : null;
    const categoryName = String(body?.categoryName || "").trim();
    const totalWeight = Number(body?.totalWeight);
    const quantity = Number(body?.quantity);
    const costPerGram = Number(body?.costPerGram);
    const purchaseDate = body?.purchaseDate ? new Date(body.purchaseDate) : new Date();
    const notes = body?.notes ? String(body.notes) : null;

    if (!categoryName) return errorResponse("Category name is required", 400);
    if (!Number.isFinite(totalWeight) || totalWeight <= 0) return errorResponse("Total weight must be > 0", 400);
    if (!Number.isFinite(quantity) || quantity < 1) return errorResponse("Quantity must be >= 1", 400);
    if (!Number.isFinite(costPerGram) || costPerGram < 0) return errorResponse("Cost per gram must be >= 0", 400);

    const totalCost = calculatePurchaseTotal(totalWeight, costPerGram);

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
      },
    });

    return successResponse(
      {
        ...created,
        totalWeight: Number(created.totalWeight),
        costPerGram: Number(created.costPerGram),
        totalCost: Number(created.totalCost),
      },
      201
    );
  } catch (err) {
    console.error("Failed to create purchase:", err);
    return errorResponse("Failed to create purchase", 500);
  }
}

