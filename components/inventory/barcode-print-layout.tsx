"use client";

import { BarcodeLabel } from "@/components/inventory/barcode-label";

export interface BarcodePrintItem {
  id: string;
  sku: string;
  barcode: string;
  imageData?: string;
  weightGrams?: number;
  category?: { name: string };
}

interface BarcodePrintLayoutProps {
  items: BarcodePrintItem[];
  labelsPerPage?: number;
  columns?: number;
  showImage?: boolean;
  showDetails?: boolean;
}

export function BarcodePrintLayout({
  items,
  labelsPerPage = 15,
  columns = 3,
  showImage = true,
  showDetails = true,
}: BarcodePrintLayoutProps) {
  const pages: BarcodePrintItem[][] = [];

  for (let i = 0; i < items.length; i += labelsPerPage) {
    pages.push(items.slice(i, i + labelsPerPage));
  }

  if (pages.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No items to print.</p>
    );
  }

  return (
    <div className="barcode-print-pages">
      {pages.map((pageItems, pageIndex) => (
        <div
          key={pageIndex}
          className={`barcode-print-page ${pageIndex < pages.length - 1 ? "print-page" : ""}`}
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${columns}, 1fr)`,
            gap: "8px",
          }}
        >
          {pageItems.map((item) => (
            <BarcodeLabel
              key={item.id}
              sku={item.sku}
              barcode={item.barcode}
              imageData={item.imageData}
              categoryName={item.category?.name}
              weightGrams={item.weightGrams}
              showImage={showImage}
              showDetails={showDetails}
              className="border border-dashed border-gray-300 rounded"
            />
          ))}
        </div>
      ))}
    </div>
  );
}
