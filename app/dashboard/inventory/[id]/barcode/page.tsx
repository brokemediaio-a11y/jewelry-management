"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BarcodeLabel } from "@/components/inventory/barcode-label";
import "../../barcode-print.css";

interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  imageData: string;
  weightGrams: number;
  category?: { name: string };
}

export default function SingleBarcodePrintPage() {
  const params = useParams();
  const id = params.id as string;

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItem = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/inventory/${id}`);
      const data = await res.json();

      if (data.success) {
        setItem(data.data);
      } else {
        setError(data.error || "Item not found");
      }
    } catch {
      setError("Failed to load inventory item");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href={`/dashboard/inventory/${id}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Print Barcode</h1>
            <p className="text-sm text-muted-foreground">
              {item ? item.sku : "Loading..."}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} disabled={!item}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : error ? (
        <div className="no-print space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory">Back to Inventory</Link>
          </Button>
        </div>
      ) : item ? (
        <div className="flex justify-center py-8">
          <BarcodeLabel
            sku={item.sku}
            barcode={item.barcode}
            imageData={item.imageData}
            categoryName={item.category?.name}
            weightGrams={item.weightGrams}
            showImage
            showDetails
            className="min-w-[200px] border border-gray-300 rounded-lg p-4"
          />
        </div>
      ) : null}
    </div>
  );
}
