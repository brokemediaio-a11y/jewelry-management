"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { PageHeader } from "@/components/dashboard/page-header";
import { CustomerDetailHeader } from "@/components/customers/customer-detail-header";
import { CustomerForm, type CustomerFormData } from "@/components/customers/customer-form";
import { ReportExportLink } from "@/components/reports/report-export-link";
import { useToast } from "@/components/ui/toaster";
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
  const { toast } = useToast();
  const id = params.id as string;

  const [customer, setCustomer] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

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

  const handleEditSave = async (data: CustomerFormData) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.success) {
        setEditOpen(false);
        await fetchCustomer();
        toast({ title: "Customer updated", variant: "success" });
      } else {
        toast({ title: json.error || "Failed to update customer", variant: "error" });
      }
    } catch {
      toast({ title: "Failed to update customer", variant: "error" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        router.push("/dashboard/customers");
      } else {
        setDeleteError(data.error || "Failed to delete customer");
      }
    } catch {
      setDeleteError("Failed to delete customer");
    } finally {
      setDeleting(false);
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
      <PageHeader
        title={customer.name}
        description="Customer profile and purchase history"
        breadcrumbs={[
          { label: "Customers", href: "/dashboard/customers" },
          { label: customer.name },
        ]}
        actions={
          <ReportExportLink
            href={`/dashboard/reports/customer-statement?period=this-month&customerId=${id}`}
            label="Customer statement"
          />
        }
      />

      <CustomerDetailHeader
        customer={customer}
        onEdit={() => setEditOpen(true)}
        onDelete={() => {
          setDeleteError(null);
          setDeleteOpen(true);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Purchase history</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomerPurchaseHistory purchases={customer.sales} />
        </CardContent>
      </Card>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit customer</DialogTitle>
          </DialogHeader>
          <CustomerForm
            defaultValues={{
              name: customer.name,
              phone: customer.phone || "",
              email: customer.email || "",
              address: customer.address || "",
            }}
            onSubmit={handleEditSave}
            isSubmitting={saving}
            submitLabel="Save changes"
            showCancel
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete this customer?"
        description="This action cannot be undone. Sales linked to this customer will remain but the customer record will be removed."
        confirmLabel="Delete customer"
        destructive
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteOpen(false);
          setDeleteError(null);
        }}
      />

      {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
    </div>
  );
}
