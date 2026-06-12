"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarcodePrintLayout,
  BarcodePrintItem,
} from "@/components/inventory/barcode-print-layout";
import "../barcode-print.css";

async function fetchAllInventory(status: string): Promise<BarcodePrintItem[]> {
  const allItems: BarcodePrintItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      page: String(page),
      limit: "100",
      status,
    });

    const res = await fetch(`/api/inventory?${params}`);
    const data = await res.json();

    if (!data.success) break;

    allItems.push(...data.data);
    totalPages = data.pagination?.totalPages || 1;
    page++;
  }

  return allItems;
}

export function BulkBarcodePrintContent() {
  const searchParams = useSearchParams();
  const status = searchParams.get("status") || "AVAILABLE";

  const [items, setItems] = useState<BarcodePrintItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchAllInventory(status);
      setItems(data);
    } catch {
      setError("Failed to load inventory items");
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="no-print flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/inventory">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Print All Barcodes</h1>
            <p className="text-sm text-muted-foreground">
              {loading
                ? "Loading..."
                : `${items.length} ${status.toLowerCase()} item${items.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint} disabled={loading || items.length === 0}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading inventory...</p>
      ) : error ? (
        <div className="no-print space-y-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button asChild variant="outline">
            <Link href="/dashboard/inventory">Back to Inventory</Link>
          </Button>
        </div>
      ) : (
        <BarcodePrintLayout items={items} />
      )}
    </div>
  );
}
