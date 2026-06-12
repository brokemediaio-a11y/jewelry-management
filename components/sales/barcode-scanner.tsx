"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Camera, CameraOff } from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
import { Button } from "@/components/ui/button";
import "./barcode-scanner.css";

interface BarcodeScannerProps {
  onScan: (value: string) => void;
  onError?: (message: string) => void;
  disabled?: boolean;
}

const SUPPORTED_FORMATS = [
  Html5QrcodeSupportedFormats.CODE_128,
  Html5QrcodeSupportedFormats.CODE_39,
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.QR_CODE,
];

async function pickCameraId(): Promise<string> {
  const cameras = await Html5Qrcode.getCameras();
  if (cameras.length === 0) {
    throw new Error("No camera found on this device");
  }

  const backCamera = cameras.find((camera) =>
    /back|rear|environment/i.test(camera.label)
  );
  return (backCamera ?? cameras[0]).id;
}

export function BarcodeScanner({
  onScan,
  onError,
  disabled = false,
}: BarcodeScannerProps) {
  const elementId = `barcode-scanner-${useId().replace(/:/g, "")}`;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanRef = useRef<{ value: string; at: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [active, setActive] = useState(false);
  const [starting, setStarting] = useState(false);

  const stopScanner = useCallback(async () => {
    setScanning(false);
    setActive(false);

    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch {
        // Scanner may already be stopped
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!scanning) return;

    let cancelled = false;

    const start = async () => {
      setStarting(true);

      try {
        // Ensure the container is visible and laid out before html5-qrcode mounts video
        await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

        const scanner = new Html5Qrcode(elementId, {
          formatsToSupport: SUPPORTED_FORMATS,
          useBarCodeDetectorIfSupported: true,
          verbose: false,
        });

        const cameraId = await pickCameraId();

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const width = Math.min(Math.floor(viewfinderWidth * 0.9), 400);
              const height = Math.min(Math.floor(viewfinderHeight * 0.45), 180);
              return { width: Math.max(width, 200), height: Math.max(height, 80) };
            },
            aspectRatio: 1.7777778,
          },
          (decodedText) => {
            const now = Date.now();
            const last = lastScanRef.current;
            if (
              last &&
              last.value === decodedText &&
              now - last.at < 2000
            ) {
              return;
            }
            lastScanRef.current = { value: decodedText, at: now };
            onScan(decodedText);
          },
          () => {
            // No match in this frame — expected while scanning
          }
        );

        if (cancelled) {
          await scanner.stop();
          scanner.clear();
          return;
        }

        scannerRef.current = scanner;
        setActive(true);
      } catch (error) {
        if (!cancelled) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not start camera. Use SKU input instead.";
          onError?.(message);
          setScanning(false);
        }
      } finally {
        if (!cancelled) {
          setStarting(false);
        }
      }
    };

    void start();

    return () => {
      cancelled = true;
      void (async () => {
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
            scannerRef.current.clear();
          } catch {
            // ignore
          }
          scannerRef.current = null;
        }
      })();
    };
  }, [scanning, elementId, onScan, onError]);

  useEffect(() => {
    return () => {
      void stopScanner();
    };
  }, [stopScanner]);

  const handleToggle = () => {
    if (active || scanning) {
      void stopScanner();
    } else {
      lastScanRef.current = null;
      setScanning(true);
    }
  };

  const showPreview = scanning || active;

  return (
    <div className="barcode-scanner-region space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Camera Scanner</p>
        <Button
          type="button"
          variant={showPreview ? "destructive" : "outline"}
          size="sm"
          disabled={disabled || starting}
          onClick={handleToggle}
        >
          {showPreview ? (
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
        className={
          showPreview
            ? "overflow-hidden rounded-lg border bg-black"
            : "hidden"
        }
      />

      {!showPreview && (
        <p className="text-xs text-muted-foreground">
          Point camera at barcode or use SKU input for USB scanners
        </p>
      )}

      {starting && (
        <p className="text-xs text-muted-foreground">Starting camera...</p>
      )}
    </div>
  );
}
