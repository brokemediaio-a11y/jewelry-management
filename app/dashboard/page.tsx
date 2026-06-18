"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Banknote,
  Package,
  ShoppingCart,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatPKR } from "@/lib/currency-utils";
import {
  formatSaleStatus,
  saleStatusVariant,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableSkeleton } from "@/components/dashboard/table-skeleton";
import { EmptyState } from "@/components/dashboard/empty-state";
import { TodaysSilverRateCard } from "@/components/dashboard/todays-silver-rate";
import { Eye, ShoppingBag } from "lucide-react";

interface RecentSale {
  id: string;
  invoiceNumber: string | null;
  saleType: string;
  status: string;
  finalPrice: number;
  createdAt: string;
  customer: { id: string; name: string } | null;
  itemsSummary?: string;
  _count?: { items: number };
}

interface DashboardStats {
  availableInventory: number;
  monthlySalesCount: number;
  monthlyRevenue: number;
  monthlyNetProfit: number;
  cashInHand?: number;
  openCustomOrders: number;
  recentSales: RecentSale[];
}

function formatSaleDate(dateStr: string): string {
  const date = new Date(dateStr);
  const today = new Date();
  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStats(data.data);
        } else {
          setError(data.error || "Failed to load dashboard");
        }
      })
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your jewelry shop"
        actions={
          <Button asChild variant="bronze">
            <Link href="/dashboard/sales/new">New Sale</Link>
          </Button>
        }
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && stats.openCustomOrders > 0 && (
        <Alert className="border-warning-border bg-warning-muted text-[var(--warning)]">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Open custom orders</AlertTitle>
          <AlertDescription>
            {stats.openCustomOrders} custom order
            {stats.openCustomOrders !== 1 ? "s" : ""} awaiting pickup or final
            payment.{" "}
            <Link
              href="/dashboard/sales?status=OPEN&saleType=CUSTOM_ORDER"
              className="font-medium underline"
            >
              View open orders
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => window.location.href = "/dashboard/reports/cash-position?period=this-month"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : formatPKR(stats?.cashInHand ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Cash sales − cash expenses</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => window.location.href = "/dashboard/reports/sales-register?period=this-month"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : formatPKR(stats?.monthlyRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed sales</p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => window.location.href = "/dashboard/reports/profit-loss?period=this-month"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit This Month</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : formatPKR(stats?.monthlyNetProfit ?? 0)}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <p className="cursor-help text-xs text-muted-foreground underline decoration-dotted">
                  After costs & expenses
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                Revenue − purchase cost − external order cost − all expenses
              </TooltipContent>
            </Tooltip>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => window.location.href = "/dashboard/sales?period=this-month"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : stats?.monthlySalesCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Including open orders</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md lg:col-span-1" onClick={() => window.location.href = "/dashboard/inventory?status=AVAILABLE"}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tabular-nums">
              {loading ? "—" : stats?.availableInventory ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Items in stock</p>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <TodaysSilverRateCard />
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Sales</CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/sales">View all</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <TableSkeleton rows={5} cols={6} />
          ) : !stats?.recentSales.length ? (
            <EmptyState
              icon={ShoppingBag}
              title="No sales yet"
              description="Start your first sale to see recent transactions here."
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
                    <TableHead>Items</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentSales.map((sale) => (
                    <TableRow
                      key={sale.id}
                      className="cursor-pointer"
                      onClick={() => {
                        window.location.href = `/dashboard/sales/${sale.id}`;
                      }}
                    >
                      <TableCell className="whitespace-nowrap">
                        {formatSaleDate(sale.createdAt)}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {sale.invoiceNumber ? (
                          <Link
                            href={`/dashboard/sales/${sale.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {sale.invoiceNumber}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {sale.customer ? (
                          <Link
                            href={`/dashboard/customers/${sale.customer.id}`}
                            className="hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {sale.customer.name}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="block truncate text-sm text-muted-foreground">
                              {sale.itemsSummary || "—"}
                              {sale._count?.items
                                ? ` (${sale._count.items} item${sale._count.items !== 1 ? "s" : ""})`
                                : ""}
                            </span>
                          </TooltipTrigger>
                          {sale.itemsSummary && (
                            <TooltipContent className="max-w-sm">
                              {sale.itemsSummary}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}
