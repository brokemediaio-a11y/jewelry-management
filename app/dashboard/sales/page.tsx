"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { formatPKR } from "@/lib/currency-utils";
import {
  formatSaleStatus,
  formatSaleType,
  saleStatusVariant,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { ShoppingBag } from "lucide-react";

interface Sale {
  id: string;
  invoiceNumber: string | null;
  saleType: string;
  status: string;
  finalPrice: number;
  createdAt: string;
  customer: { id: string; name: string; phone: string | null } | null;
  _count?: { items: number };
}

export default function SalesPage() {
  const router = useRouter();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (saleTypeFilter !== "all") params.set("saleType", saleTypeFilter);
      if (statusFilter !== "all") params.set("status", statusFilter);

      const res = await fetch(`/api/sales?${params}`);
      const data = await res.json();

      if (data.success) {
        setSales(
          data.data.map((sale: Sale & { finalPrice: number | string }) => ({
            ...sale,
            finalPrice: Number(sale.finalPrice),
          }))
        );
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } finally {
      setLoading(false);
    }
  }, [page, saleTypeFilter, statusFilter]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  useEffect(() => {
    setPage(1);
  }, [saleTypeFilter, statusFilter]);

  const pageStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const pageEnd = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales"
        description="View and manage sales transactions"
        actions={
          <>
            <Button variant="outline" className="hidden sm:inline-flex" asChild>
              <Link href="/dashboard/reports/sales-register?period=this-month">
                Sales register
              </Link>
            </Button>
            <Button asChild variant="bronze">
              <Link href="/dashboard/sales/new">
                <Plus className="mr-2 h-4 w-4" />
                New Sale
              </Link>
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Sales List</CardTitle>
          <CardDescription>Filter by sale type or status</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Select value={saleTypeFilter} onValueChange={setSaleTypeFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Sale type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PURCHASE">From Stock</SelectItem>
                <SelectItem value="CUSTOM_ORDER">Custom Order</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <TableSkeleton rows={8} cols={7} />
          ) : sales.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No sales found"
              description="Create a new sale or adjust your filters."
              action={
                <Button asChild>
                  <Link href="/dashboard/sales/new">New Sale</Link>
                </Button>
              }
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Final Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sales.map((sale) => (
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
                      <TableCell>
                        {sale.customer?.name || "—"}
                      </TableCell>
                      <TableCell>{formatSaleType(sale.saleType)}</TableCell>
                      <TableCell>{sale._count?.items ?? 0}</TableCell>
                      <TableCell>
                        <StatusBadge
                          label={formatSaleStatus(sale.status)}
                          variant={saleStatusVariant(sale.status)}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {formatPKR(sale.finalPrice)}
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                {pageStart}–{pageEnd} of {total}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
