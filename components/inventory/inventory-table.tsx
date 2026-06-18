"use client";

import { useState } from "react";
import { Eye, Printer, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  formatInventoryStatus,
  formatItemQuality,
  inventoryStatusVariant,
} from "@/lib/display-labels";
import { StatusBadge } from "@/components/ui/status-badge";
import { IconTooltipButton } from "@/components/ui/icon-tooltip-button";

export interface InventoryItemRow {
  id: string;
  sku: string;
  barcode: string;
  imageData?: string;
  weightGrams: number;
  itemQuality?: "PREMIUM" | "LOCAL";
  stoneSummary?: string | null;
  silverRateAtPurchase: number;
  purchasePricePerPiece: number;
  status: "AVAILABLE" | "SOLD" | "RESERVED";
  createdAt: string;
  category?: { id: string; name: string };
}

interface InventoryTableProps {
  items: InventoryItemRow[];
  showExtended?: boolean;
  onDelete?: (item: InventoryItemRow) => void;
}

export function InventoryTable({
  items,
  showExtended = false,
  onDelete,
}: InventoryTableProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No inventory items found. Add your first item to get started.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-md border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur w-16">Image</TableHead>
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">SKU</TableHead>
            {showExtended && (
              <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Barcode</TableHead>
            )}
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Category</TableHead>
            {showExtended && (
              <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Quality</TableHead>
            )}
            {showExtended && (
              <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Stone</TableHead>
            )}
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Weight</TableHead>
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Purchase/Piece</TableHead>
            {showExtended && (
              <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Silver Rate</TableHead>
            )}
            {showExtended && (
              <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Date</TableHead>
            )}
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur">Status</TableHead>
            <TableHead className="sticky top-0 bg-muted/80 backdrop-blur text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow
              key={item.id}
              className="cursor-pointer"
              onClick={() => {
                window.location.href = `/dashboard/inventory/${item.id}`;
              }}
            >
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
              {showExtended && (
                <TableCell className="font-mono text-sm">{item.barcode}</TableCell>
              )}
              <TableCell>{item.category?.name || "—"}</TableCell>
              {showExtended && (
                <TableCell>
                  {item.itemQuality ? formatItemQuality(item.itemQuality) : "—"}
                </TableCell>
              )}
              {showExtended && (
                <TableCell className="max-w-[160px] truncate text-sm">
                  {item.stoneSummary || "—"}
                </TableCell>
              )}
              <TableCell>{item.weightGrams.toFixed(3)} g</TableCell>
              <TableCell className="tabular-nums">{formatPKR(item.purchasePricePerPiece)}</TableCell>
              {showExtended && (
                <TableCell className="tabular-nums">{formatPKR(item.silverRateAtPurchase)}/g</TableCell>
              )}
              {showExtended && (
                <TableCell className="whitespace-nowrap text-sm">
                  {new Date(item.createdAt).toLocaleDateString()}
                </TableCell>
              )}
              <TableCell>
                <StatusBadge
                  label={formatInventoryStatus(item.status)}
                  variant={inventoryStatusVariant(item.status)}
                />
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-end gap-1">
                  {item.status === "AVAILABLE" && (
                    <IconTooltipButton
                      label="Sell this item"
                      href={`/dashboard/sales/new?sku=${encodeURIComponent(item.sku)}`}
                      icon={<ShoppingCart className="h-4 w-4" />}
                    />
                  )}
                  <IconTooltipButton
                    label="View item"
                    href={`/dashboard/inventory/${item.id}`}
                    icon={<Eye className="h-4 w-4" />}
                  />
                  <IconTooltipButton
                    label="Print barcode"
                    href={`/dashboard/inventory/${item.id}/barcode`}
                    icon={<Printer className="h-4 w-4" />}
                  />
                  {item.status === "AVAILABLE" && onDelete && (
                    <IconTooltipButton
                      label="Delete item"
                      icon={<Trash2 className="h-4 w-4" />}
                      onClick={() => onDelete(item)}
                    />
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
