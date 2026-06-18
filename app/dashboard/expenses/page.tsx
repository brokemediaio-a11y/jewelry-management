"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { PageHeader } from "@/components/dashboard/page-header";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { formatPKR } from "@/lib/currency-utils";

type ExpenseTypeFilter = "" | "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";

const QUICK_ADD = [
  { type: "SHOP" as const, label: "+ Shop" },
  { type: "HOME" as const, label: "+ Home" },
  { type: "BEOPARI" as const, label: "+ Beopari" },
  { type: "KAREGAR" as const, label: "+ Karegar" },
];

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

  const periodTotal = useMemo(
    () => rows.reduce((acc, r) => acc + Number(r.amount || 0), 0),
    [rows]
  );

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
      <PageHeader
        title="Expenses"
        description="Shop cash outflows"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={exportHref}>Export report</Link>
            </Button>
            <Button asChild variant="bronze">
              <Link href="/dashboard/expenses/new">
                <Plus className="mr-2 h-4 w-4" />
                Add Expense
              </Link>
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap gap-2">
        {QUICK_ADD.map((chip) => (
          <Button key={chip.type} variant="outline" size="sm" asChild>
            <Link href={`/dashboard/expenses/new?expenseType=${chip.type}`}>
              {chip.label}
            </Link>
          </Button>
        ))}
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>All expenses</CardTitle>
          {!loading && rows.length > 0 && (
            <p className="text-sm font-medium tabular-nums">
              Total: {formatPKR(periodTotal)}
            </p>
          )}
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

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1);
                setDateFrom(start.toISOString().slice(0, 10));
                setDateTo(now.toISOString().slice(0, 10));
              }}
            >
              This month
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDateFrom("");
                setDateTo("");
                setExpenseType("");
              }}
            >
              Clear filters
            </Button>
          </div>

          {loading ? (
            <TableSkeleton rows={6} cols={6} />
          ) : (
            <ExpenseTable rows={rows} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
