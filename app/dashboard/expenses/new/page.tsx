"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpenseForm } from "@/components/expenses/expense-form";

type ExpenseType = "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";

function NewExpenseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const expenseTypeParam = searchParams.get("expenseType");
  const expenseType =
    expenseTypeParam === "BEOPARI" ||
    expenseTypeParam === "KAREGAR" ||
    expenseTypeParam === "SHOP" ||
    expenseTypeParam === "HOME"
      ? (expenseTypeParam as ExpenseType)
      : undefined;

  return (
    <ExpenseForm
      defaultValues={{
        expenseType,
        beopariId: searchParams.get("beopariId"),
        karegarId: searchParams.get("karegarId"),
        purchaseId: searchParams.get("purchaseId"),
      }}
      onSaved={(id) => router.push(`/dashboard/expenses/${id}`)}
    />
  );
}

export default function NewExpensePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">New Expense</h1>
        <p className="text-muted-foreground">Record a cash outflow</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense details</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading form...</p>}>
            <NewExpenseContent />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
