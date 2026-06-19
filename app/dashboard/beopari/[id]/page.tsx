"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatPKR } from "@/lib/currency-utils";
import { formatPaymentMethod } from "@/lib/display-labels";
import { PageHeader } from "@/components/dashboard/page-header";

type PurchaseItemRow = {
  id: string;
  categoryName: string;
  totalWeight: number;
  quantity: number;
  costPerGram: number;
  lineTotal: number;
};

type PurchaseRow = {
  id: string;
  categoryName: string;
  totalWeight: number;
  quantity: number;
  costPerGram: number;
  totalCost: number;
  purchaseDate: string;
  paidAmount: number;
  remainingAmount: number;
  items: PurchaseItemRow[];
};

type PaymentRow = {
  id: string;
  expenseDate: string;
  amount: number;
  paymentMethod: string;
  description: string | null;
};

type BeopariDetail = {
  id: string;
  name: string;
  businessStartDate: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  purchases: PurchaseRow[];
  paymentHistory: PaymentRow[];
};

function PurchaseMetricCell({
  items,
  formatValue,
}: {
  items: PurchaseItemRow[];
  formatValue: (item: PurchaseItemRow) => string;
}) {
  if (items.length <= 1) {
    return <span>{formatValue(items[0])}</span>;
  }

  return (
    <div className="space-y-1 text-right">
      {items.map((item) => (
        <div key={item.id} className="text-xs leading-snug">
          <span className="text-muted-foreground">{item.categoryName}: </span>
          <span>{formatValue(item)}</span>
        </div>
      ))}
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-warning-border bg-warning-muted" : undefined}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function BeopariDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<BeopariDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/beopari/${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load beopari");
    } catch {
      setError("Failed to load beopari");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const purchases = useMemo(() => data?.purchases || [], [data]);
  const payments = useMemo(() => data?.paymentHistory || [], [data]);
  const recordPaymentHref = `/dashboard/expenses/new?expenseType=BEOPARI&beopariId=${id}`;

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Beopari not found"}</AlertDescription>
      </Alert>
    );
  }

  const hasRemaining = data.remainingAmount > 0.009;

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.name}
        description={`Business since ${new Date(data.businessStartDate).toLocaleDateString()}`}
        breadcrumbs={[
          { label: "Beopari", href: "/dashboard/beopari" },
          { label: data.name },
        ]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={`/dashboard/reports/supplier-statement?period=this-month&beopariId=${id}`}>
                Beopari statement
              </Link>
            </Button>
            {hasRemaining && (
              <Button asChild variant="bronze">
                <Link href={recordPaymentHref}>Record Payment</Link>
              </Button>
            )}
            <Button asChild variant={hasRemaining ? "outline" : "default"}>
              <Link href={`/dashboard/beopari/purchases/new?beopariId=${id}`}>
                <Plus className="mr-2 h-4 w-4" />
                New Purchase
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Total purchases" value={formatPKR(data.totalAmount)} />
        <KpiCard label="Paid" value={formatPKR(data.paidAmount)} />
        <KpiCard
          label="Remaining"
          value={formatPKR(data.remainingAmount)}
          highlight={hasRemaining}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {!purchases.length ? (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                    <TableHead className="text-right">Qty</TableHead>
                    <TableHead className="text-right">Cost/g</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Remaining</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchases.map((p) => {
                    const items = p.items?.length
                      ? p.items
                      : [
                          {
                            id: p.id,
                            categoryName: p.categoryName,
                            totalWeight: p.totalWeight,
                            quantity: p.quantity,
                            costPerGram: p.costPerGram,
                            lineTotal: p.totalCost,
                          },
                        ];

                    return (
                    <TableRow key={p.id}>
                      <TableCell>
                        {new Date(p.purchaseDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{p.categoryName}</TableCell>
                      <TableCell className="text-right">
                        <PurchaseMetricCell
                          items={items}
                          formatValue={(item) => `${item.totalWeight.toFixed(3)} g`}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <PurchaseMetricCell
                          items={items}
                          formatValue={(item) => String(item.quantity)}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <PurchaseMetricCell
                          items={items}
                          formatValue={(item) => formatPKR(item.costPerGram)}
                        />
                      </TableCell>
                      <TableCell className="text-right">{formatPKR(p.totalCost)}</TableCell>
                      <TableCell className="text-right">{formatPKR(p.paidAmount)}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatPKR(p.remainingAmount)}
                      </TableCell>
                      <TableCell className="text-right">
                        {p.remainingAmount > 0.009 ? (
                          <Button variant="outline" size="sm" asChild>
                            <Link
                              href={`/dashboard/expenses/new?expenseType=BEOPARI&beopariId=${id}&purchaseId=${p.id}`}
                            >
                              Pay
                            </Link>
                          </Button>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {!payments.length ? (
            <p className="text-sm text-muted-foreground">No payments recorded yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Description</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>{new Date(e.expenseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right font-medium">{formatPKR(e.amount)}</TableCell>
                    <TableCell>{formatPaymentMethod(e.paymentMethod)}</TableCell>
                    <TableCell className="max-w-[280px] truncate text-muted-foreground">
                      {e.description || "—"}
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
