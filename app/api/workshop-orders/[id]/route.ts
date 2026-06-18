import { NextRequest } from "next/server";
import { WorkshopOrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { isValidStatusTransition } from "@/lib/workshop-utils";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const body = await request.json();

    const karegarId = body?.karegarId != null ? String(body.karegarId) : null;
    const status = body?.status != null ? (String(body.status) as WorkshopOrderStatus) : null;

    const existing = await prisma.workshopOrder.findUnique({ where: { id } });
    if (!existing) return errorResponse("Workshop order not found", 404);

    if (status && !isValidStatusTransition(existing.status, status)) {
      return errorResponse(`Invalid status transition: ${existing.status} → ${status}`, 400);
    }

    const updated = await prisma.workshopOrder.update({
      where: { id },
      data: {
        ...(karegarId !== null ? { karegarId, assignedAt: new Date() } : {}),
        ...(status
          ? {
              status,
              completedAt: status === "COMPLETE" ? new Date() : null,
            }
          : {}),
      },
      include: { karegar: { select: { id: true, name: true } } },
    });

    return successResponse(updated);
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Workshop order not found", 404);
    }
    console.error("Failed to update workshop order:", error);
    return errorResponse("Failed to update workshop order", 500);
  }
}

