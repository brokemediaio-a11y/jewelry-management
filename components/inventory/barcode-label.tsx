"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";
import { getImageSrc } from "@/lib/image-utils";

export interface BarcodeLabelProps {
  sku: string;
  barcode?: string;
  imageData?: string;
  categoryName?: string;
  weightGrams?: number;
  showImage?: boolean;
  showDetails?: boolean;
  className?: string;
}

export function BarcodeLabel({
  sku,
  barcode,
  imageData,
  categoryName,
  weightGrams,
  showImage = false,
  showDetails = false,
  className = "",
}: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const value = barcode || sku;

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 1.5,
        height: 50,
        displayValue: false,
        margin: 4,
      });
    } catch {
      // Invalid barcode value
    }
  }, [value]);

  if (!value) return null;

  return (
    <div
      className={`barcode-label flex flex-col items-center justify-center bg-white p-2 text-center ${className}`}
    >
      {showImage && imageData && (
        <img
          src={getImageSrc(imageData)}
          alt={sku}
          className="mb-1 h-10 w-10 rounded object-cover"
        />
      )}
      <svg ref={svgRef} className="max-w-full" />
      <p className="mt-1 font-mono text-xs font-semibold leading-tight">{sku}</p>
      {showDetails && (categoryName || weightGrams !== undefined) && (
        <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
          {[categoryName, weightGrams !== undefined ? `${weightGrams.toFixed(1)}g` : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </div>
  );
}
