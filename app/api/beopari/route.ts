import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { paginationSchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "50",
    });
    const skip = (page - 1) * limit;

    const [rows, total] = await Promise.all([
      prisma.beopari.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          purchases: { select: { totalCost: true } },
          expenses: {
            select: {
              beopariAllocations: { select: { amount: true } },
            },
          },
        },
      }),
      prisma.beopari.count(),
    ]);

    const data = rows.map((b) => {
      const totalAmount = b.purchases.reduce((acc, p) => acc + Number(p.totalCost), 0);
      const paidAmount = b.expenses.reduce(
        (acc, e) =>
          acc + e.beopariAllocations.reduce((a2, a) => a2 + Number(a.amount), 0),
        0
      );
      const remainingAmount = totalAmount - paidAmount;
      return {
        id: b.id,
        name: b.name,
        businessStartDate: b.businessStartDate,
        notes: b.notes,
        createdAt: b.createdAt,
        updatedAt: b.updatedAt,
        totalAmount,
        paidAmount,
        remainingAmount,
      };
    });

    return paginatedResponse(data, page, limit, total);
  } catch (err) {
    console.error("Failed to fetch beoparis:", err);
    return errorResponse("Failed to fetch beoparis", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (name.length < 2) return errorResponse("Name must be at least 2 characters", 400);

    const businessStartDate = body?.businessStartDate
      ? new Date(body.businessStartDate)
      : new Date();
    const notes = body?.notes ? String(body.notes) : null;

    const created = await prisma.beopari.create({
      data: { name, businessStartDate, notes },
    });
    return successResponse(created, 201);
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2002") {
      return errorResponse("Beopari name already exists", 409);
    }
    console.error("Failed to create beopari:", error);
    return errorResponse("Failed to create beopari", 500);
  }
}

