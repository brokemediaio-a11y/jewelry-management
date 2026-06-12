"use client";

import Link from "next/link";
import { Printer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarcodePreview } from "@/components/inventory/barcode-preview";
import { formatPKR } from "@/lib/currency-utils";
import { getImageSrc } from "@/lib/image-utils";

interface SaleHistory {
  sale: {
    id: string;
    invoiceNumber: string;
    status: string;
    createdAt: string;
  };
}

export interface InventoryDetailData {
  id: string;
  sku: string;
  barcode: string;
  imageData: string;
  imageMimeType: string;
  weightGrams: number;
  hasStone: boolean;
  stoneType: string | null;
  stoneDetails: string | null;
  silverRateAtPurchase: number;
  purchasePricePerGram: number;
  purchasePricePerPiece: number;
  status: "AVAILABLE" | "SOLD" | "RESERVED";
  createdAt: string;
  category?: { id: string; name: string };
  saleItems?: SaleHistory[];
}

interface InventoryDetailProps {
  item: InventoryDetailData;
  onDelete?: () => void;
  deleting?: boolean;
}

function StatusBadge({ status }: { status: InventoryDetailData["status"] }) {
  const styles: Record<InventoryDetailData["status"], string> = {
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

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  );
}

export function InventoryDetail({ item, onDelete, deleting = false }: InventoryDetailProps) {
  const saleHistory = item.saleItems?.[0]?.sale;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Product Image</CardTitle>
        </CardHeader>
        <CardContent>
          <img
            src={getImageSrc(item.imageData)}
            alt={item.sku}
            className="mx-auto max-h-96 w-full rounded-lg border object-contain"
          />
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Item Details</CardTitle>
            <StatusBadge status={item.status} />
          </CardHeader>
          <CardContent>
            <DetailRow label="SKU" value={<span className="font-mono">{item.sku}</span>} />
            <DetailRow label="Barcode" value={<span className="font-mono">{item.barcode}</span>} />
            <DetailRow label="Category" value={item.category?.name || "—"} />
            <DetailRow label="Weight" value={`${item.weightGrams.toFixed(3)} g`} />
            <DetailRow
              label="Silver Rate at Purchase"
              value={`${formatPKR(item.silverRateAtPurchase)}/g`}
            />
            <DetailRow label="Stone" value={item.hasStone ? "Yes" : "No"} />
            {item.hasStone && (
              <DetailRow label="Stone Type" value={item.stoneType || "—"} />
            )}
            <DetailRow
              label="Purchase Price per Gram"
              value={formatPKR(item.purchasePricePerGram)}
            />
            <DetailRow
              label="Purchase Price per Piece"
              value={formatPKR(item.purchasePricePerPiece)}
            />
            <DetailRow
              label="Added"
              value={new Date(item.createdAt).toLocaleString()}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Barcode</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/inventory/${item.id}/barcode`}>
                <Printer className="mr-2 h-4 w-4" />
                Print Barcode
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="flex justify-center bg-white p-4">
            <BarcodePreview value={item.barcode} />
          </CardContent>
        </Card>

        {saleHistory && (
          <Card>
            <CardHeader>
              <CardTitle>Sale History</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm">
                Sold via invoice{" "}
                <span className="font-mono font-medium">{saleHistory.invoiceNumber}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                {new Date(saleHistory.createdAt).toLocaleString()} — {saleHistory.status}
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/dashboard/sales/${saleHistory.id}`}>View Sale</Link>
              </Button>
            </CardContent>
          </Card>
        )}

        {item.status === "AVAILABLE" && onDelete && (
          <Button variant="destructive" onClick={onDelete} disabled={deleting}>
            {deleting ? "Deleting..." : "Delete Item"}
          </Button>
        )}
      </div>
    </div>
  );
}
