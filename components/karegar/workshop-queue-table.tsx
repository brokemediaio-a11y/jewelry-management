"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { formatSaleSource, formatWorkshopStatus } from "@/lib/display-labels";
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
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toaster";

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
    pickupDate?: string | null;
  };
  paidAmount: number;
};

function isPickupOverdue(pickupDate: string | null | undefined): boolean {
  if (!pickupDate) return false;
  const pickup = new Date(pickupDate);
  pickup.setHours(23, 59, 59, 999);
  return pickup < new Date();
}

export function WorkshopQueueTable({
  rows,
  karegars,
  onUpdated,
}: {
  rows: WorkshopQueueRow[];
  karegars: KaregarOption[];
  onUpdated: () => void;
}) {
  const { toast } = useToast();
  const [savingId, setSavingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkKaregarId, setBulkKaregarId] = useState("");
  const [bulkSaving, setBulkSaving] = useState(false);

  const selectableRows = rows.filter((r) => r.status !== "COMPLETE");

  const patch = async (
    id: string,
    payload: { karegarId?: string | null; status?: string }
  ) => {
    setSavingId(id);
    try {
      const res = await fetch(`/api/workshop-orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!data.success) {
        toast({ title: data.error || "Update failed", variant: "error" });
        return;
      }
      onUpdated();
    } finally {
      setSavingId(null);
    }
  };

  const toggleAll = () => {
    if (selected.size === selectableRows.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(selectableRows.map((r) => r.id)));
    }
  };

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const bulkAssign = async () => {
    if (!selected.size || !bulkKaregarId) return;
    setBulkSaving(true);
    try {
      const res = await fetch("/api/workshop-orders/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: Array.from(selected),
          karegarId: bulkKaregarId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: `Assigned ${data.data.updated} order${data.data.updated !== 1 ? "s" : ""}`,
          variant: "success",
        });
        setSelected(new Set());
        setBulkKaregarId("");
        onUpdated();
      } else {
        toast({ title: data.error || "Bulk assign failed", variant: "error" });
      }
    } catch {
      toast({ title: "Bulk assign failed", variant: "error" });
    } finally {
      setBulkSaving(false);
    }
  };

  if (!rows.length) {
    return <p className="text-sm text-muted-foreground">No workshop orders found.</p>;
  }

  return (
    <div className="space-y-3">
      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/40 p-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <Select value={bulkKaregarId} onValueChange={setBulkKaregarId}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Assign to karegar" />
            </SelectTrigger>
            <SelectContent>
              {karegars.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="bronze"
            disabled={!bulkKaregarId || bulkSaving}
            onClick={bulkAssign}
          >
            {bulkSaving ? "Assigning…" : "Assign selected"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
            Clear
          </Button>
        </div>
      )}

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={
                    selectableRows.length > 0 && selected.size === selectableRows.length
                  }
                  onChange={toggleAll}
                  disabled={!selectableRows.length}
                  className="rounded border"
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Pickup</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Description / Items</TableHead>
              <TableHead>Assigned To</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Sale</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((o) => {
              const overdue =
                o.status !== "COMPLETE" && isPickupOverdue(o.sale.pickupDate);
              const unassigned = !o.karegar?.id && o.status !== "COMPLETE";
              const isComplete = o.status === "COMPLETE";

              return (
                <TableRow
                  key={o.id}
                  className={cn(
                    overdue && "bg-warning-muted/80",
                    unassigned && !overdue && "bg-info-muted/60"
                  )}
                >
                  <TableCell>
                    {!isComplete && (
                      <input
                        type="checkbox"
                        checked={selected.has(o.id)}
                        onChange={() => toggleOne(o.id)}
                        className="rounded border"
                        aria-label={`Select order ${o.sale.invoiceNumber || o.id}`}
                      />
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {o.sale.invoiceNumber || "—"}
                  </TableCell>
                  <TableCell>{o.sale.customer?.name || "—"}</TableCell>
                  <TableCell
                    className={cn(
                      "whitespace-nowrap text-sm",
                      overdue && "font-medium text-[var(--warning)]"
                    )}
                  >
                    {o.sale.pickupDate
                      ? new Date(o.sale.pickupDate).toLocaleDateString()
                      : "—"}
                    {overdue && " (overdue)"}
                  </TableCell>
                  <TableCell>{formatSaleSource(o.sale.source)}</TableCell>
                  <TableCell className="max-w-[280px] truncate text-sm text-muted-foreground">
                    {o.sale.itemsSummary}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={o.karegar?.id || ""}
                      disabled={savingId === o.id || isComplete}
                      onValueChange={(v) => patch(o.id, { karegarId: v || null })}
                    >
                      <SelectTrigger className="w-[180px]">
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
                        <SelectValue>{formatWorkshopStatus(o.status)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SENT_TO_WORKSHOP">Sent to Workshop</SelectItem>
                        <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                        <SelectItem value="COMPLETE">Complete</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/sales/${o.sale.id}`}>Invoice</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
