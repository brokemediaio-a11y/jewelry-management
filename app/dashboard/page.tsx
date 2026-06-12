"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Eye,
  Package,
  ShoppingCart,
  TrendingUp,
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
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency-utils";

interface RecentSale {
  id: string;
  invoiceNumber: string | null;
  saleType: string;
  status: string;
  finalPrice: number;
  createdAt: string;
  customer: { id: string; name: string } | null;
  _count?: { items: number };
}

interface DashboardStats {
  availableInventory: number;
  monthlySalesCount: number;
  monthlyRevenue: number;
  openCustomOrders: number;
  recentSales: RecentSale[];
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    OPEN: "bg-amber-100 text-amber-800 border-amber-200",
    CANCELLED: "bg-muted text-muted-foreground",
  };

  return (
    <Badge variant="outline" className={styles[status] || ""}>
      {status}
    </Badge>
  );
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your jewelry shop management
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {stats && stats.openCustomOrders > 0 && (
        <Alert className="border-amber-300 bg-amber-50 text-amber-900">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Open custom orders</AlertTitle>
          <AlertDescription>
            {stats.openCustomOrders} custom order
            {stats.openCustomOrders !== 1 ? "s" : ""} awaiting pickup or final
            payment.{" "}
            <Link href="/dashboard/sales" className="font-medium underline">
              View sales
            </Link>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : stats?.availableInventory ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Items in stock</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales This Month</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : stats?.monthlySalesCount ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Non-cancelled sales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : formatPKR(stats?.monthlyRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Completed sales (PKR)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Custom Orders</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {loading ? "—" : stats?.openCustomOrders ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting completion</p>
          </CardContent>
        </Card>
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
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : !stats?.recentSales.length ? (
            <p className="text-sm text-muted-foreground">No recent sales</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-mono text-sm">
                      {sale.invoiceNumber || "—"}
                    </TableCell>
                    <TableCell>{sale.customer?.name || "—"}</TableCell>
                    <TableCell>{sale._count?.items ?? 0}</TableCell>
                    <TableCell>
                      <StatusBadge status={sale.status} />
                    </TableCell>
                    <TableCell>{formatPKR(sale.finalPrice)}</TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString()}
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
