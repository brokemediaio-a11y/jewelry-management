import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { getPurchasePaidRemaining, serializePurchaseItems } from "@/lib/beopari-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const purchase = await prisma.beopariPurchase.findUnique({
      where: { id },
      include: {
        beopari: { select: { id: true, name: true } },
        allocations: { select: { amount: true, expenseId: true } },
        items: { orderBy: { categoryName: "asc" } },
      },
    });
    if (!purchase) return errorResponse("Purchase not found", 404);

    const totalCost = Number(purchase.totalCost);
    const { paidAmount, remainingAmount } = getPurchasePaidRemaining(
      totalCost,
      purchase.allocations
    );

    return successResponse({
      ...purchase,
      totalWeight: Number(purchase.totalWeight),
      costPerGram: Number(purchase.costPerGram),
      totalCost,
      paidAmount,
      remainingAmount,
      items: serializePurchaseItems(purchase),
    });
  } catch (err) {
    console.error("Failed to fetch purchase:", err);
    return errorResponse("Failed to fetch purchase", 500);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const allocCount = await prisma.expenseBeopariAllocation.count({
      where: { beopariPurchaseId: id },
    });
    if (allocCount > 0) {
      return errorResponse("Cannot delete purchase with payment allocations", 400);
    }
    await prisma.beopariPurchase.delete({ where: { id } });
    return successResponse({ message: "Purchase deleted successfully" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Purchase not found", 404);
    }
    console.error("Failed to delete purchase:", error);
    return errorResponse("Failed to delete purchase", 500);
  }
}
