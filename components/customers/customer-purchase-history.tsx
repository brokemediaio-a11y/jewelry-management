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

export type CustomerPurchaseRow = {
  id: string;
  createdAt: string;
  invoiceNumber: string | null;
  saleType: string;
  status: string;
  source: string;
  itemsSummary: string;
  finalPrice: number;
  advancePaid: number | null;
};

export function CustomerPurchaseHistory({
  purchases,
}: {
  purchases: CustomerPurchaseRow[];
}) {
  if (!purchases.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchases found for this customer.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Items / Description</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead className="text-right">Paid</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">View</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {purchases.map((sale) => (
          <TableRow key={sale.id}>
            <TableCell>{new Date(sale.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="font-mono text-sm">
              {sale.invoiceNumber || "—"}
            </TableCell>
            <TableCell>{sale.saleType.replace("_", " ")}</TableCell>
            <TableCell>{sale.source}</TableCell>
            <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
              {sale.itemsSummary || "—"}
            </TableCell>
            <TableCell className="text-right">{formatPKR(sale.finalPrice)}</TableCell>
            <TableCell className="text-right">
              {sale.saleType === "CUSTOM_ORDER" && sale.status === "OPEN"
                ? formatPKR(sale.advancePaid || 0)
                : formatPKR(sale.finalPrice)}
            </TableCell>
            <TableCell>
              <Badge variant="outline">{sale.status}</Badge>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/dashboard/sales/${sale.id}`}>
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

