import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2) {
    return successResponse({ customers: [], inventory: [], sales: [] });
  }

  try {
    const [customers, inventory, sales] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { phone: { contains: q } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { name: "asc" },
        select: { id: true, name: true, phone: true },
      }),
      prisma.inventoryItem.findMany({
        where: {
          OR: [
            { sku: { contains: q, mode: "insensitive" } },
            { barcode: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          sku: true,
          barcode: true,
          status: true,
          category: { select: { name: true } },
        },
      }),
      prisma.sale.findMany({
        where: {
          invoiceNumber: { contains: q, mode: "insensitive" },
        },
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          invoiceNumber: true,
          status: true,
          createdAt: true,
          customer: { select: { name: true } },
        },
      }),
    ]);

    return successResponse({ customers, inventory, sales });
  } catch (err) {
    console.error("Search failed:", err);
    return errorResponse("Search failed", 500);
  }
}
