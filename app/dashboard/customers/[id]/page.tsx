"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CustomerDetailHeader } from "@/components/customers/customer-detail-header";
import { ReportExportLink } from "@/components/reports/report-export-link";
import {
  CustomerPurchaseHistory,
  type CustomerPurchaseRow,
} from "@/components/customers/customer-purchase-history";

type CustomerDetail = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  sales: CustomerPurchaseRow[];
};

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCustomer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/customers/${id}?limit=50`);
      const data = await res.json();

      if (data.success) {
        setCustomer(data.data);
      } else {
        setError(data.error || "Customer not found");
      }
    } catch {
      setError("Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomer();
  }, [fetchCustomer]);

  const handleEdit = () => {
    router.push("/dashboard/customers");
  };

  const handleDelete = async () => {
    if (!confirm("Delete this customer? This action cannot be undone.")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      router.push("/dashboard/customers");
    } else {
      alert(data.error || "Failed to delete customer");
    }
  };

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading...</p>;
  }

  if (error || !customer) {
    return (
      <div className="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>{error || "Customer not found"}</AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link href="/dashboard/customers">Back to Customers</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <ReportExportLink
          href={`/dashboard/reports/customer-statement?period=this-month&customerId=${id}`}
          label="Customer statement"
        />
      </div>

      <CustomerDetailHeader
        customer={customer}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPurchaseHistory purchases={customer.sales} />
        </CardContent>
      </Card>
    </div>
  );
}

