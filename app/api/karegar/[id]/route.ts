import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getKaregarPaidTotals } from "@/lib/expense-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const karegar = await prisma.karegar.findUnique({
      where: { id },
      include: {
        workshopOrders: {
          orderBy: { createdAt: "desc" },
          include: { sale: true, allocations: { select: { amount: true } } },
        },
        expenses: {
          orderBy: { expenseDate: "desc" },
          include: { workshopAllocations: { select: { amount: true } } },
        },
      },
    });
    if (!karegar) return errorResponse("Karegar not found", 404);

    const { allTime, thisMonth } = await getKaregarPaidTotals(id);

    return successResponse({
      ...karegar,
      paidAmount: allTime,
      paidThisMonth: thisMonth,
      expenses: karegar.expenses.map((e) => ({
        id: e.id,
        expenseDate: e.expenseDate,
        amount: Number(e.amount),
        paymentMethod: e.paymentMethod,
        description: e.description,
      })),
    });
  } catch (err) {
    console.error("Failed to fetch karegar:", err);
    return errorResponse("Failed to fetch karegar", 500);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const body = await request.json();
    const name = body?.name != null ? String(body.name).trim() : undefined;
    const phone = body?.phone != null ? String(body.phone) : undefined;
    const isActive = body?.isActive != null ? Boolean(body.isActive) : undefined;

    const updated = await prisma.karegar.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(phone !== undefined ? { phone } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
    });

    return successResponse(updated);
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Karegar not found", 404);
    }
    console.error("Failed to update karegar:", error);
    return errorResponse("Failed to update karegar", 500);
  }
}

