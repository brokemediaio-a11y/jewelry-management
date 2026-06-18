import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { aggregateBeopariLedger } from "@/lib/beopari-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const ledger = await aggregateBeopariLedger(id);
    if (!ledger) return errorResponse("Beopari not found", 404);

    return successResponse(ledger);
  } catch (err) {
    console.error("Failed to fetch beopari:", err);
    return errorResponse("Failed to fetch beopari", 500);
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
    const notes = body?.notes != null ? String(body.notes) : undefined;
    const businessStartDate = body?.businessStartDate ? new Date(body.businessStartDate) : undefined;

    const updated = await prisma.beopari.update({
      where: { id },
      data: {
        ...(name ? { name } : {}),
        ...(notes !== undefined ? { notes } : {}),
        ...(businessStartDate ? { businessStartDate } : {}),
      },
    });

    return successResponse(updated);
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Beopari not found", 404);
    }
    console.error("Failed to update beopari:", error);
    return errorResponse("Failed to update beopari", 500);
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
    const purchaseCount = await prisma.beopariPurchase.count({ where: { beopariId: id } });
    if (purchaseCount > 0) {
      return errorResponse("Cannot delete beopari with purchases", 400);
    }
    await prisma.beopari.delete({ where: { id } });
    return successResponse({ message: "Beopari deleted successfully" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Beopari not found", 404);
    }
    console.error("Failed to delete beopari:", error);
    return errorResponse("Failed to delete beopari", 500);
  }
}

