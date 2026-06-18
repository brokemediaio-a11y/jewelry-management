"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency-utils";
import {
  expenseTypeVariant,
  formatExpenseType,
  formatPaymentMethod,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";

export type ExpenseRow = {
  id: string;
  expenseType: "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";
  expenseDate: string;
  amount: number;
  paymentMethod: string;
  description: string | null;
  beopari?: { id: string; name: string } | null;
  karegar?: { id: string; name: string } | null;
};

function summary(expense: ExpenseRow): string {
  if (expense.expenseType === "BEOPARI") return expense.beopari?.name || "Beopari";
  if (expense.expenseType === "KAREGAR") return expense.karegar?.name || "Karegar";
  return (expense.description || "—").trim();
}

export function ExpenseTable({ rows }: { rows: ExpenseRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No expenses found.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Payee / Description</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Method</TableHead>
            <TableHead className="text-right">View</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id} className="cursor-pointer" onClick={() => {
              window.location.href = `/dashboard/expenses/${e.id}`;
            }}>
              <TableCell className="whitespace-nowrap">
                {new Date(e.expenseDate).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell>
                <StatusBadge
                  label={formatExpenseType(e.expenseType)}
                  variant={expenseTypeVariant(e.expenseType)}
                />
              </TableCell>
              <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
                {summary(e)}
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">
                {formatPKR(e.amount)}
              </TableCell>
              <TableCell>{formatPaymentMethod(e.paymentMethod)}</TableCell>
              <TableCell className="text-right" onClick={(ev) => ev.stopPropagation()}>
                <IconTooltipButton
                  label="View expense"
                  href={`/dashboard/expenses/${e.id}`}
                  icon={<Eye className="h-4 w-4" />}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
