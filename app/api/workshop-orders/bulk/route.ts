import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const orderIds = Array.isArray(body?.orderIds) ? (body.orderIds as string[]) : [];
    const karegarId = body?.karegarId != null ? String(body.karegarId) : null;

    if (!orderIds.length) return errorResponse("No orders selected", 400);
    if (!karegarId) return errorResponse("Karegar is required", 400);

    const karegar = await prisma.karegar.findUnique({ where: { id: karegarId } });
    if (!karegar) return errorResponse("Karegar not found", 404);

    const result = await prisma.workshopOrder.updateMany({
      where: {
        id: { in: orderIds },
        status: { not: "COMPLETE" },
      },
      data: {
        karegarId,
        assignedAt: new Date(),
      },
    });

    return successResponse({ updated: result.count });
  } catch (err) {
    console.error("Bulk assign failed:", err);
    return errorResponse("Failed to assign orders", 500);
  }
}
