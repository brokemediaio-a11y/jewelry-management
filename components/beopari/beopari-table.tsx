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
import { formatPKR } from "@/lib/currency-utils";

export type BeopariRow = {
  id: string;
  name: string;
  businessStartDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
};

export function BeopariTable({ rows }: { rows: BeopariRow[] }) {
  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No beoparis found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Business Start</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead className="text-right">Remaining</TableHead>
          <TableHead className="text-right">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((b) => (
          <TableRow key={b.id}>
            <TableCell className="font-medium">{b.name}</TableCell>
            <TableCell>{new Date(b.businessStartDate).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">{formatPKR(b.totalAmount)}</TableCell>
            <TableCell className="text-right">{formatPKR(b.paidAmount)}</TableCell>
            <TableCell className="text-right">{formatPKR(b.remainingAmount)}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/dashboard/beopari/${b.id}`}>
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

