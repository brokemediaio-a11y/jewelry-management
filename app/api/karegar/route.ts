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
      prisma.karegar.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.karegar.count(),
    ]);

    return paginatedResponse(rows, page, limit, total);
  } catch (err) {
    console.error("Failed to fetch karegars:", err);
    return errorResponse("Failed to fetch karegars", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const name = String(body?.name || "").trim();
    if (name.length < 2) return errorResponse("Name must be at least 2 characters", 400);

    const phone = body?.phone ? String(body.phone) : null;
    const isActive = body?.isActive != null ? Boolean(body.isActive) : true;

    const created = await prisma.karegar.create({
      data: { name, phone, isActive },
    });

    return successResponse(created, 201);
  } catch (err) {
    console.error("Failed to create karegar:", err);
    return errorResponse("Failed to create karegar", 500);
  }
}

