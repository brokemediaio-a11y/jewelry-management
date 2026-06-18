"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface CustomerRow {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address?: string | null;
  createdAt?: string;
  _count?: { sales: number };
}

interface CustomerTableProps {
  customers: CustomerRow[];
  onEdit?: (customer: CustomerRow) => void;
  onDelete?: (customer: CustomerRow) => void;
}

export function CustomerTable({ customers, onEdit, onDelete }: CustomerTableProps) {
  if (customers.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No customers found. Add your first customer to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {customers.map((customer) => (
          <TableRow key={customer.id}>
            <TableCell className="font-medium">{customer.name}</TableCell>
            <TableCell>{customer.phone || "—"}</TableCell>
            <TableCell>{customer.email || "—"}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/customers/${customer.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                {onEdit && (
                  <Button variant="ghost" size="icon" onClick={() => onEdit(customer)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(customer)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
