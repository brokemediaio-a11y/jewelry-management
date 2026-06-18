"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/currency-utils";

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
          <TableRow key={e.id}>
            <TableCell>{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
            <TableCell>
              <Badge variant="outline">{e.expenseType}</Badge>
            </TableCell>
            <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
              {summary(e)}
            </TableCell>
            <TableCell className="text-right">{formatPKR(e.amount)}</TableCell>
            <TableCell>{e.paymentMethod.replace("_", " ")}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/dashboard/expenses/${e.id}`}>
                  <Eye className="h-4 w-4" />
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

