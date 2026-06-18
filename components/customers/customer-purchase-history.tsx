"use client";

import { useRouter } from "next/navigation";
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
  formatSaleSource,
  formatSaleStatus,
  formatSaleType,
  saleStatusVariant,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";

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
  const router = useRouter();

  if (!purchases.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No purchases found for this customer.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
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
            <TableRow
              key={sale.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/sales/${sale.id}`)}
            >
              <TableCell className="whitespace-nowrap">
                {new Date(sale.createdAt).toLocaleDateString(undefined, {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {sale.invoiceNumber || "—"}
              </TableCell>
              <TableCell>{formatSaleType(sale.saleType)}</TableCell>
              <TableCell>{formatSaleSource(sale.source)}</TableCell>
              <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
                {sale.itemsSummary || "—"}
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatPKR(sale.finalPrice)}</TableCell>
              <TableCell className="text-right tabular-nums">
                {sale.saleType === "CUSTOM_ORDER" && sale.status === "OPEN"
                  ? formatPKR(sale.advancePaid || 0)
                  : formatPKR(sale.finalPrice)}
              </TableCell>
              <TableCell>
                <StatusBadge
                  label={formatSaleStatus(sale.status)}
                  variant={saleStatusVariant(sale.status)}
                />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <IconTooltipButton
                  label="View sale"
                  href={`/dashboard/sales/${sale.id}`}
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
