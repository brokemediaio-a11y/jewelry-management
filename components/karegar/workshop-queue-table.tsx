"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KaregarOption = { id: string; name: string };

export type WorkshopQueueRow = {
  id: string;
  status: "SENT_TO_WORKSHOP" | "IN_PROGRESS" | "COMPLETE";
  createdAt: string;
  karegar: { id: string; name: string } | null;
  sale: {
    id: string;
    invoiceNumber: string | null;
    customer: { id: string; name: string } | null;
    source: string;
    itemsSummary: string;
  };
  paidAmount: number;
};

export function WorkshopQueueTable({
  rows,
  karegars,
  onUpdated,
}: {
  rows: WorkshopQueueRow[];
  karegars: KaregarOption[];
  onUpdated: () => void;
}) {
  const [savingId, setSavingId] = useState<string | null>(null);

  const patch = async (
    id: string,
    payload: { karegarId?: string | null; status?: string }
  ) => {
    setSavingId(id);
    try {
      await fetch(`/api/workshop-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      onUpdated();
    } finally {
      setSavingId(null);
    }
  };

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No workshop orders found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead>Source</TableHead>
          <TableHead>Description / Items</TableHead>
          <TableHead>Assigned To</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Sale</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((o) => (
          <TableRow key={o.id}>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(o.createdAt).toLocaleDateString()}
            </TableCell>
            <TableCell className="font-mono text-sm">{o.sale.invoiceNumber || "—"}</TableCell>
            <TableCell>{o.sale.customer?.name || "—"}</TableCell>
            <TableCell>{o.sale.source}</TableCell>
            <TableCell className="max-w-[420px] truncate text-sm text-muted-foreground">
              {o.sale.itemsSummary}
            </TableCell>
            <TableCell>
              <Select
                value={o.karegar?.id || ""}
                disabled={savingId === o.id}
                onValueChange={(v) => patch(o.id, { karegarId: v || null })}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select karegar" />
                </SelectTrigger>
                <SelectContent>
                  {karegars.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      {k.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Select
                value={o.status}
                disabled={savingId === o.id}
                onValueChange={(v) => patch(o.id, { status: v })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SENT_TO_WORKSHOP">Sent</SelectItem>
                  <SelectItem value="IN_PROGRESS">In progress</SelectItem>
                  <SelectItem value="COMPLETE">Complete</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" asChild>
                <Link href={`/dashboard/sales/${o.sale.id}`}>
                  <Badge variant="outline">View</Badge>
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

