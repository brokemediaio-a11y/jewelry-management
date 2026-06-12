"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export function BarcodeScanner({
  onScan,
  onError,
  disabled = false,
}: BarcodeScannerProps) {
  const elementId = useId().replace(/:/g, "");
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);

  const stopScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
    setActive(false);
  }, []);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const startScanner = async () => {
    if (disabled || starting) return;

    setStarting(true);
    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 150 } },
        (decodedText) => {
          onScan(decodedText);
        },
        () => {
          // Ignore scan failures while searching
        }
      );

      setActive(true);
    } catch {
      onError?.("Could not access camera. Use SKU input instead.");
      await stopScanner();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Camera Scanner</p>
        <Button
          type="button"
          variant={active ? "destructive" : "outline"}
          size="sm"
          disabled={disabled || starting}
          onClick={active ? stopScanner : startScanner}
        >
          {active ? (
            <>
              <CameraOff className="mr-2 h-4 w-4" />
              Stop
            </>
          ) : (
            <>
              <Camera className="mr-2 h-4 w-4" />
              {starting ? "Starting..." : "Start Camera"}
            </>
          )}
        </Button>
      </div>
      <div
        id={elementId}
        className={`overflow-hidden rounded-lg border bg-muted/30 ${active ? "min-h-[200px]" : "hidden"}`}
      />
      {!active && (
        <p className="text-xs text-muted-foreground">
          Point camera at barcode or use SKU input for USB scanners
        </p>
      )}
    </div>
  );
}
