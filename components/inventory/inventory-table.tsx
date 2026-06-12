"use client";

import Link from "next/link";
import { Eye, Printer, Trash2 } from "lucide-react";
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
import { formatPKR } from "@/lib/currency-utils";
import { getImageSrc } from "@/lib/image-utils";

export interface InventoryItemRow {
  id: string;
  sku: string;
  barcode: string;
  imageData?: string;
  weightGrams: number;
  silverRateAtPurchase: number;
  purchasePricePerPiece: number;
  status: "AVAILABLE" | "SOLD" | "RESERVED";
  createdAt: string;
  category?: { id: string; name: string };
}

interface InventoryTableProps {
  items: InventoryItemRow[];
  onDelete?: (item: InventoryItemRow) => void;
}

function StatusBadge({ status }: { status: InventoryItemRow["status"] }) {
  const styles: Record<InventoryItemRow["status"], string> = {
    AVAILABLE: "bg-green-100 text-green-800 border-green-200",
    SOLD: "bg-muted text-muted-foreground",
    RESERVED: "bg-amber-100 text-amber-800 border-amber-200",
  };

  return (
    <Badge variant="outline" className={styles[status]}>
      {status}
    </Badge>
  );
}

export function InventoryTable({ items, onDelete }: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No inventory items found. Add your first item to get started.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-16">Image</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Barcode</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Weight</TableHead>
          <TableHead>Purchase/Piece</TableHead>
          <TableHead>Silver Rate</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Date</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>
              {item.imageData ? (
                <img
                  src={getImageSrc(item.imageData)}
                  alt={item.sku}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                  —
                </div>
              )}
            </TableCell>
            <TableCell className="font-mono text-sm">{item.sku}</TableCell>
            <TableCell className="font-mono text-sm">{item.barcode}</TableCell>
            <TableCell>{item.category?.name || "—"}</TableCell>
            <TableCell>{item.weightGrams.toFixed(3)} g</TableCell>
            <TableCell>{formatPKR(item.purchasePricePerPiece)}</TableCell>
            <TableCell>{formatPKR(item.silverRateAtPurchase)}/g</TableCell>
            <TableCell>
              <StatusBadge status={item.status} />
            </TableCell>
            <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-1">
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/inventory/${item.id}`}>
                    <Eye className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild>
                  <Link href={`/dashboard/inventory/${item.id}/barcode`}>
                    <Printer className="h-4 w-4" />
                  </Link>
                </Button>
                {item.status === "AVAILABLE" && onDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(item)}
                  >
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
