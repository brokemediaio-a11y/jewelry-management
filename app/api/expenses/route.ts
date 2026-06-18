import { NextRequest } from "next/server";
import { Prisma, ExpenseType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, paginatedResponse, successResponse } from "@/lib/api-response";
import { createExpenseSchema, paginationSchema } from "@/lib/validations";
import { roundPKR } from "@/lib/currency-utils";
import {
  assertExpenseDescriptionRequired,
  validateAllocationsSumToAmount,
  validateBeopariAllocations,
} from "@/lib/expense-utils";

export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const searchParams = request.nextUrl.searchParams;
    const { page, limit } = paginationSchema.parse({
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "10",
    });

    const expenseType = searchParams.get("expenseType") as ExpenseType | null;
    const beopariId = searchParams.get("beopariId");
    const karegarId = searchParams.get("karegarId");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");

    const where: Prisma.ExpenseWhereInput = {};
    if (expenseType) where.expenseType = expenseType;
    if (beopariId) where.beopariId = beopariId;
    if (karegarId) where.karegarId = karegarId;
    if (dateFrom || dateTo) {
      where.expenseDate = {};
      if (dateFrom) where.expenseDate.gte = new Date(dateFrom);
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        where.expenseDate.lte = end;
      }
    }

    const skip = (page - 1) * limit;
    const [rows, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { expenseDate: "desc" },
        include: {
          beopari: { select: { id: true, name: true } },
          karegar: { select: { id: true, name: true } },
          beopariAllocations: { select: { amount: true } },
          workshopAllocations: { select: { amount: true } },
        },
      }),
      prisma.expense.count({ where }),
    ]);

    const data = rows.map((e) => ({
      ...e,
      amount: Number(e.amount),
      beopariAllocationsTotal: e.beopariAllocations.reduce(
        (acc, a) => acc + Number(a.amount),
        0
      ),
      workshopAllocationsTotal: e.workshopAllocations.reduce(
        (acc, a) => acc + Number(a.amount),
        0
      ),
    }));

    return paginatedResponse(data, page, limit, total);
  } catch (err) {
    console.error("Failed to fetch expenses:", err);
    return errorResponse("Failed to fetch expenses", 500);
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const body = await request.json();
    const data = createExpenseSchema.parse(body);

    const amount = roundPKR(Number(data.amount));
    const expenseDate = data.expenseDate ? new Date(data.expenseDate) : new Date();

    assertExpenseDescriptionRequired({
      expenseType: data.expenseType,
      description: data.description,
    });

    if (data.expenseType === "BEOPARI" || data.expenseType === "KAREGAR") {
      validateAllocationsSumToAmount(data.allocations, amount);
    }

    if (data.expenseType === "BEOPARI" && data.beopariId) {
      await validateBeopariAllocations(data.allocations, data.beopariId);
    }

    const created = await prisma.$transaction(async (tx) => {
      const expense = await tx.expense.create({
        data: {
          expenseType: data.expenseType,
          amount: new Prisma.Decimal(amount),
          expenseDate,
          description: data.description || null,
          paymentMethod: data.paymentMethod,
          userId: auth.session.id,
          beopariId: data.beopariId || null,
          karegarId: data.karegarId || null,
        },
      });

      if (data.expenseType === "BEOPARI") {
        await tx.expenseBeopariAllocation.createMany({
          data: data.allocations.map((a) => ({
            expenseId: expense.id,
            beopariPurchaseId: a.targetId,
            amount: new Prisma.Decimal(roundPKR(Number(a.amount))),
          })),
        });
      }

      if (data.expenseType === "KAREGAR") {
        await tx.expenseWorkshopAllocation.createMany({
          data: data.allocations.map((a) => ({
            expenseId: expense.id,
            workshopOrderId: a.targetId,
            amount: new Prisma.Decimal(roundPKR(Number(a.amount))),
          })),
        });
      }

      return tx.expense.findUnique({
        where: { id: expense.id },
        include: {
          beopari: { select: { id: true, name: true } },
          karegar: { select: { id: true, name: true } },
          beopariAllocations: true,
          workshopAllocations: true,
        },
      });
    });

    return successResponse(
      {
        ...created,
        amount: Number(created?.amount || 0),
      },
      201
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message) {
      return errorResponse(error.message, 400);
    }
    if (error && typeof error === "object" && (error as { name?: string }).name === "ZodError") {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || "Validation error", 400);
    }
    console.error("Failed to create expense:", error);
    return errorResponse("Failed to create expense", 500);
  }
}

