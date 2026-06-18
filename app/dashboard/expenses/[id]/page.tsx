"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPKR } from "@/lib/currency-utils";
import { ExpenseForm } from "@/components/expenses/expense-form";

type ExpenseDetail = {
  id: string;
  expenseType: "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";
  amount: number;
  expenseDate: string;
  paymentMethod: "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CHEQUE";
  description: string | null;
  beopari?: { id: string; name: string } | null;
  karegar?: { id: string; name: string } | null;
  beopariAllocations?: Array<{ beopariPurchaseId: string; amount: number }>;
  workshopAllocations?: Array<{ workshopOrderId: string; amount: number }>;
};

export default function ExpenseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [expense, setExpense] = useState<ExpenseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);

  const fetchExpense = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/expenses/${id}`);
      const data = await res.json();
      if (data.success) setExpense(data.data);
      else setError(data.error || "Expense not found");
    } catch {
      setError("Failed to load expense");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchExpense();
  }, [fetchExpense]);

  const handleDelete = async () => {
    if (!confirm("Delete this expense?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) router.push("/dashboard/expenses");
      else alert(data.error || "Failed to delete expense");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (error || !expense) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Expense not found"}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/dashboard/expenses">Back to Expenses</Link>
        </Button>
      </div>
    );
  }

  const allocations =
    expense.expenseType === "BEOPARI"
      ? (expense.beopariAllocations || []).map((a) => ({
          targetId: a.beopariPurchaseId,
          amount: Number(a.amount),
        }))
      : expense.expenseType === "KAREGAR"
        ? (expense.workshopAllocations || []).map((a) => ({
            targetId: a.workshopOrderId,
            amount: Number(a.amount),
          }))
        : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/expenses">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditing((v) => !v)}>
            <Pencil className="mr-2 h-4 w-4" />
            {editing ? "Cancel edit" : "Edit"}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {editing ? (
        <Card>
          <CardHeader>
            <CardTitle>Edit expense</CardTitle>
          </CardHeader>
          <CardContent>
            <ExpenseForm
              expenseId={expense.id}
              defaultValues={{
                expenseType: expense.expenseType,
                paymentMethod: expense.paymentMethod,
                expenseDate: expense.expenseDate.slice(0, 10),
                description: expense.description || "",
                amount: expense.amount,
                beopariId: expense.beopari?.id ?? null,
                karegarId: expense.karegar?.id ?? null,
                allocations,
              }}
              onSaved={() => {
                setEditing(false);
                fetchExpense();
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Expense</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Type</span>
              <span className="font-medium">{expense.expenseType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">
                {new Date(expense.expenseDate).toLocaleDateString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">{formatPKR(expense.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Payment method</span>
              <span className="font-medium">{expense.paymentMethod.replace("_", " ")}</span>
            </div>
            {expense.beopari?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Beopari</span>
                <span className="font-medium">{expense.beopari.name}</span>
              </div>
            )}
            {expense.karegar?.name && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Karegar</span>
                <span className="font-medium">{expense.karegar.name}</span>
              </div>
            )}
            {expense.description && (
              <div className="pt-2">
                <p className="text-muted-foreground">Description</p>
                <p className="whitespace-pre-wrap">{expense.description}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
