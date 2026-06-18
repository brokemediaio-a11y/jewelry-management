"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { formatPKR } from "@/lib/currency-utils";
import { ReportExportLink } from "@/components/reports/report-export-link";

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

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    OPEN: "bg-amber-100 text-amber-800 border-amber-200",
    CANCELLED: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={variants[status] || ""}>
      {status}
    </Badge>
  );
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [saleTypeFilter, setSaleTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales</h1>
          <p className="text-muted-foreground">View and manage sales transactions</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportExportLink
            href="/dashboard/reports/sales-register?period=this-month"
            label="Export sales"
          />
          <ReportExportLink
            href="/dashboard/reports/sales-margin?period=this-month"
            label="Sales margin"
          />
          <Button asChild>
            <Link href="/dashboard/sales/new">
              <Plus className="mr-2 h-4 w-4" />
              New Sale
            </Link>
          </Button>
        </div>
      </div>

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
                <SelectItem value="PURCHASE">Purchase</SelectItem>
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
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : sales.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sales yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Final Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">
                      {sale.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>{sale.customer?.name || "—"}</TableCell>
                    <TableCell>{sale._count?.items ?? 0}</TableCell>
                    <TableCell>{sale.saleType.replace("_", " ")}</TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell>{formatPKR(sale.finalPrice)}</TableCell>
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
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
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
