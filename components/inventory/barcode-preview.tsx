"use client";

import { useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

interface BarcodePreviewProps {
  value: string;
}

export function BarcodePreview({ value }: BarcodePreviewProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;

    try {
      JsBarcode(svgRef.current, value, {
        format: "CODE128",
        width: 2,
        height: 80,
        displayValue: true,
        fontSize: 14,
        margin: 10,
      });
    } catch {
      // Invalid barcode value during typing
    }
  }, [value]);

  if (!value) {
    return <p className="text-sm text-muted-foreground">Select a category to preview barcode</p>;
  }

  return <svg ref={svgRef} className="max-w-full" />;
}
