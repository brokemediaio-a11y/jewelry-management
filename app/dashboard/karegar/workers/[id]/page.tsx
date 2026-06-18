"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
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

type PaymentRow = {
  id: string;
  expenseDate: string;
  amount: number;
  paymentMethod: string;
  description: string | null;
};

type KaregarDetail = {
  id: string;
  name: string;
  phone: string | null;
  isActive: boolean;
  paidAmount: number;
  paidThisMonth: number;
  expenses: PaymentRow[];
};

export default function KaregarDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<KaregarDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/karegar/${id}`);
      const json = await res.json();
      if (json.success) setData(json.data);
      else setError(json.error || "Failed to load karegar");
    } catch {
      setError("Failed to load karegar");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  if (error || !data) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || "Karegar not found"}</AlertDescription>
      </Alert>
    );
  }

  const recordPaymentHref = `/dashboard/expenses/new?expenseType=KAREGAR&karegarId=${data.id}`;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/karegar">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
            <p className="text-muted-foreground">
              {data.phone || "No phone"} · Paid this month {formatPKR(data.paidThisMonth)} · All
              time {formatPKR(data.paidAmount)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link href={recordPaymentHref}>
              <Plus className="mr-2 h-4 w-4" />
              Record Payment
            </Link>
          </Button>
          <ReportExportLink
            href={`/dashboard/reports/karegar-payments?period=this-month&karegarId=${data.id}`}
            label="Payment report"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payment history</CardTitle>
        </CardHeader>
        <CardContent>
          {!data.expenses.length ? (
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
                {data.expenses.map((e) => (
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
