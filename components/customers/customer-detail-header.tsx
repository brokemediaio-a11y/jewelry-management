"use client";

import { Button } from "@/components/ui/button";

type Customer = {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
};

export function CustomerDetailHeader({
  customer,
  onEdit,
  onDelete,
}: {
  customer: Customer;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight">{customer.name}</h1>
        <div className="text-sm text-muted-foreground">
          <p>{customer.phone || "—"}</p>
          <p>{customer.email || "—"}</p>
          {customer.address && <p>{customer.address}</p>}
        </div>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={onEdit}>
          Edit
        </Button>
        <Button variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}

