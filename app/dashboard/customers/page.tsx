"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CustomerForm,
  CustomerFormData,
} from "@/components/customers/customer-form";
import {
  CustomerTable,
  CustomerRow,
} from "@/components/customers/customer-table";
import { DeleteCustomerDialog } from "@/components/customers/delete-customer-dialog";

function matchesSearch(customer: CustomerRow, query: string): boolean {
  const q = query.toLowerCase();
  return (
    customer.name.toLowerCase().includes(q) ||
    (customer.phone?.toLowerCase().includes(q) ?? false) ||
    (customer.email?.toLowerCase().includes(q) ?? false)
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomerRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers?limit=100");
      const data = await res.json();

      if (data.success) {
        setCustomers(data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const filteredCustomers = useMemo(() => {
    if (!search.trim()) return customers;
    return customers.filter((c) => matchesSearch(c, search.trim()));
  }, [customers, search]);

  const openCreate = () => {
    setEditingCustomer(null);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (customer: CustomerRow) => {
    setEditingCustomer(customer);
    setFormError(null);
    setFormOpen(true);
  };

  const handleSubmit = async (formData: CustomerFormData) => {
    setSubmitting(true);
    setFormError(null);

    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setFormOpen(false);
        setEditingCustomer(null);
        fetchCustomers();
      } else {
        setFormError(data.error || "Failed to save customer");
      }
    } catch {
      setFormError("An error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/customers/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await res.json();

      if (data.success) {
        setDeleteTarget(null);
        fetchCustomers();
      } else {
        setDeleteError(data.error || "Failed to delete customer");
      }
    } catch {
      setDeleteError("An error occurred while deleting");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer database
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Customers List</CardTitle>
          <CardDescription>
            Search by name, phone, or email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : (
            <CustomerTable
              customers={filteredCustomers}
              onEdit={openEdit}
              onDelete={(customer) => {
                setDeleteError(null);
                setDeleteTarget(customer);
              }}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? "Edit Customer" : "Add Customer"}
            </DialogTitle>
            <DialogDescription>
              {editingCustomer
                ? "Update customer details"
                : "Create a new customer record"}
            </DialogDescription>
          </DialogHeader>

          {formError && (
            <p className="text-sm text-destructive">{formError}</p>
          )}

          <CustomerForm
            key={editingCustomer?.id || "new"}
            defaultValues={
              editingCustomer
                ? {
                    name: editingCustomer.name,
                    phone: editingCustomer.phone || "",
                    email: editingCustomer.email || "",
                    address: editingCustomer.address || "",
                  }
                : undefined
            }
            onSubmit={handleSubmit}
            isSubmitting={submitting}
            submitLabel={editingCustomer ? "Update Customer" : "Create Customer"}
          />
        </DialogContent>
      </Dialog>

      <DeleteCustomerDialog
        open={Boolean(deleteTarget)}
        customerName={deleteTarget?.name || ""}
        loading={deleting}
        error={deleteError}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteTarget(null);
          setDeleteError(null);
        }}
      />
    </div>
  );
}
