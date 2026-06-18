import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/api-response";
import { updateExpenseSchema } from "@/lib/validations";
import { roundPKR } from "@/lib/currency-utils";
import {
  assertExpenseDescriptionRequired,
  validateAllocationsSumToAmount,
  validateBeopariAllocations,
} from "@/lib/expense-utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if ("error" in auth) return errorResponse(auth.error, auth.status);

  try {
    const { id } = await params;
    const expense = await prisma.expense.findUnique({
      where: { id },
      include: {
        beopari: { select: { id: true, name: true } },
        karegar: { select: { id: true, name: true } },
        beopariAllocations: { include: { beopariPurchase: true } },
        workshopAllocations: { include: { workshopOrder: { include: { sale: true } } } },
      },
    });
    if (!expense) return errorResponse("Expense not found", 404);
    return successResponse({ ...expense, amount: Number(expense.amount) });
  } catch (err) {
    console.error("Failed to fetch expense:", err);
    return errorResponse("Failed to fetch expense", 500);
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
    const data = updateExpenseSchema.parse(body);

    if (data.expenseType) {
      assertExpenseDescriptionRequired({
        expenseType: data.expenseType,
        description: data.description,
      });
    }

    const amount = data.amount != null ? roundPKR(Number(data.amount)) : undefined;
    if (data.expenseType && data.allocations && amount != null) {
      if (data.expenseType === "BEOPARI" || data.expenseType === "KAREGAR") {
        validateAllocationsSumToAmount(data.allocations, amount);
      }
      if (data.expenseType === "BEOPARI" && data.beopariId) {
        await validateBeopariAllocations(data.allocations, data.beopariId);
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Clear allocations if switching away or rewriting
      await tx.expenseBeopariAllocation.deleteMany({ where: { expenseId: id } });
      await tx.expenseWorkshopAllocation.deleteMany({ where: { expenseId: id } });

      await tx.expense.update({
        where: { id },
        data: {
          expenseType: data.expenseType,
          amount:
            data.amount != null ? new Prisma.Decimal(roundPKR(Number(data.amount))) : undefined,
          expenseDate: data.expenseDate ? new Date(data.expenseDate) : undefined,
          description: data.description ?? undefined,
          paymentMethod: data.paymentMethod,
          beopariId: data.beopariId ?? undefined,
          karegarId: data.karegarId ?? undefined,
          userId: auth.session.id,
        },
      });

      if (data.expenseType === "BEOPARI" && data.allocations?.length) {
        await tx.expenseBeopariAllocation.createMany({
          data: data.allocations.map((a) => ({
            expenseId: id,
            beopariPurchaseId: a.targetId,
            amount: new Prisma.Decimal(roundPKR(Number(a.amount))),
          })),
        });
      }

      if (data.expenseType === "KAREGAR" && data.allocations?.length) {
        await tx.expenseWorkshopAllocation.createMany({
          data: data.allocations.map((a) => ({
            expenseId: id,
            workshopOrderId: a.targetId,
            amount: new Prisma.Decimal(roundPKR(Number(a.amount))),
          })),
        });
      }

      return tx.expense.findUnique({
        where: { id },
        include: {
          beopari: { select: { id: true, name: true } },
          karegar: { select: { id: true, name: true } },
          beopariAllocations: true,
          workshopAllocations: true,
        },
      });
    });

    if (!updated) return errorResponse("Expense not found", 404);
    return successResponse({ ...updated, amount: Number(updated.amount) });
  } catch (error: unknown) {
    if (error instanceof Error && error.message) {
      return errorResponse(error.message, 400);
    }
    if (error && typeof error === "object" && (error as { name?: string }).name === "ZodError") {
      const first = (error as { errors?: Array<{ message?: string }> }).errors?.[0]?.message;
      return errorResponse(first || "Validation error", 400);
    }
    console.error("Failed to update expense:", error);
    return errorResponse("Failed to update expense", 500);
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

    await prisma.$transaction(async (tx) => {
      await tx.expenseBeopariAllocation.deleteMany({ where: { expenseId: id } });
      await tx.expenseWorkshopAllocation.deleteMany({ where: { expenseId: id } });
      await tx.expense.delete({ where: { id } });
    });

    return successResponse({ message: "Expense deleted successfully" });
  } catch (error: unknown) {
    if (error && typeof error === "object" && (error as { code?: string }).code === "P2025") {
      return errorResponse("Expense not found", 404);
    }
    console.error("Failed to delete expense:", error);
    return errorResponse("Failed to delete expense", 500);
  }
}

