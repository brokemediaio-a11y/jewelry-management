"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseTable, type ExpenseRow } from "@/components/expenses/expense-table";
import { ReportExportLink } from "@/components/reports/report-export-link";

type ExpenseTypeFilter = "" | "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";

export default function ExpensesPage() {
  const [rows, setRows] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expenseType, setExpenseType] = useState<ExpenseTypeFilter>("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (expenseType) params.set("expenseType", expenseType);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);

      const res = await fetch(`/api/expenses?${params}`);
      const data = await res.json();
      if (data.success) {
        setRows(data.data);
      } else {
        setError(data.error || "Failed to load expenses");
      }
    } catch {
      setError("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [expenseType, dateFrom, dateTo]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const exportHref = (() => {
    const params = new URLSearchParams({ period: "this-month" });
    if (expenseType) params.set("expenseType", expenseType);
    if (dateFrom) {
      params.set("period", "custom");
      params.set("from", dateFrom);
    }
    if (dateTo) {
      params.set("period", "custom");
      params.set("to", dateTo);
    }
    return `/dashboard/reports/expense-breakdown?${params}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
          <p className="text-muted-foreground">Shop cash outflows</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportExportLink href={exportHref} label="Export expenses" />
          <Button asChild>
            <Link href="/dashboard/expenses/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>All expenses</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={expenseType || "ALL"}
                onValueChange={(v) => setExpenseType(v === "ALL" ? "" : (v as ExpenseTypeFilter))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All</SelectItem>
                  <SelectItem value="BEOPARI">Beopari</SelectItem>
                  <SelectItem value="KAREGAR">Karegar</SelectItem>
                  <SelectItem value="SHOP">Shop</SelectItem>
                  <SelectItem value="HOME">Home</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>From date</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>To date</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <ExpenseTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
