"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { ReportExportLink } from "@/components/reports/report-export-link";

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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
          <p className="text-muted-foreground">
            Total {formatPKR(data.totalAmount)} · Paid {formatPKR(data.paidAmount)} · Remaining{" "}
            {formatPKR(data.remainingAmount)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ReportExportLink
            href={`/dashboard/reports/supplier-statement?period=this-month&beopariId=${id}`}
            label="Supplier statement"
          />
          <Button asChild variant="outline">
            <Link href={recordPaymentHref}>Record Payment</Link>
          </Button>
          <Button asChild>
            <Link href={`/dashboard/beopari/purchases/new?beopariId=${id}`}>
              <Plus className="mr-2 h-4 w-4" />
              New Purchase
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {!purchases.length ? (
            <p className="text-sm text-muted-foreground">No purchases yet.</p>
          ) : (
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchases.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{new Date(p.purchaseDate).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{p.categoryName}</TableCell>
                    <TableCell className="text-right">{p.totalWeight.toFixed(3)} g</TableCell>
                    <TableCell className="text-right">{p.quantity}</TableCell>
                    <TableCell className="text-right">{formatPKR(p.costPerGram)}</TableCell>
                    <TableCell className="text-right">{formatPKR(p.totalCost)}</TableCell>
                    <TableCell className="text-right">{formatPKR(p.paidAmount)}</TableCell>
                    <TableCell className="text-right">{formatPKR(p.remainingAmount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
                    <TableCell>{e.paymentMethod.replace("_", " ")}</TableCell>
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
