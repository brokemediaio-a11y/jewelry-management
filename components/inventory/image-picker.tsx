"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fileToBase64 } from "@/lib/image-utils";

interface ImagePickerProps {
  value?: string;
  onChange: (dataUri: string, mimeType: string) => void;
  onClear?: () => void;
}

export function ImagePicker({ value, onChange, onClear }: ImagePickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [capturing, setCapturing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      for (const track of streamRef.current.getTracks()) {
        track.stop();
      }
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraReady(false);
  }, []);

  const attachStreamToVideo = useCallback(async (stream: MediaStream) => {
    const video = videoRef.current;
    if (!video) return false;

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");
    video.muted = true;

    await new Promise<void>((resolve, reject) => {
      const onReady = () => {
        video.removeEventListener("loadedmetadata", onReady);
        resolve();
      };
      video.addEventListener("loadedmetadata", onReady);
      video.play().catch(reject);
    });

    if (video.videoWidth > 0 && video.videoHeight > 0) {
      setCameraReady(true);
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    if (!cameraOpen) {
      stopStream();
      setCameraError(null);
      return;
    }

    let cancelled = false;
    setCameraError(null);
    setCameraReady(false);

    const startCamera = async () => {
      try {
        const constraints: MediaStreamConstraints[] = [
          { video: { facingMode: { ideal: "environment" } }, audio: false },
          { video: true, audio: false },
        ];

        let nextStream: MediaStream | null = null;
        let lastError: unknown = null;

        for (const constraint of constraints) {
          try {
            nextStream = await navigator.mediaDevices.getUserMedia(constraint);
            break;
          } catch (err) {
            lastError = err;
          }
        }

        if (!nextStream) {
          throw lastError ?? new Error("Unable to access camera");
        }

        if (cancelled) {
          for (const track of nextStream.getTracks()) track.stop();
          return;
        }

        streamRef.current = nextStream;

        // Dialog content may mount slightly after open — retry attach briefly
        let attached = await attachStreamToVideo(nextStream);
        if (!attached && !cancelled) {
          for (let i = 0; i < 10; i += 1) {
            await new Promise((r) => setTimeout(r, 100));
            if (cancelled) return;
            attached = await attachStreamToVideo(nextStream);
            if (attached) break;
          }
        }

        if (!attached && !cancelled) {
          setCameraError("Camera preview not ready. Please try again.");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        const msg =
          e && typeof e === "object" && "message" in e
            ? String((e as { message?: unknown }).message || "")
            : "";
        setCameraError(msg || "Unable to access camera");
      }
    };

    void startCamera();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [cameraOpen, attachStreamToVideo, stopStream]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video) {
      setCameraError("Camera not available");
      return;
    }

    setCapturing(true);
    setCameraError(null);

    try {
      let width = video.videoWidth;
      let height = video.videoHeight;

      if (!width || !height) {
        await new Promise((r) => setTimeout(r, 200));
        width = video.videoWidth;
        height = video.videoHeight;
      }

      if (!width || !height) {
        setCameraError("Camera not ready yet — wait for the preview, then try again.");
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        setCameraError("Failed to capture image");
        return;
      }

      ctx.drawImage(video, 0, 0, width, height);
      const dataUri = canvas.toDataURL("image/jpeg", 0.9);

      if (!dataUri || dataUri === "data:,") {
        setCameraError("Failed to capture image");
        return;
      }

      onChange(dataUri, "image/jpeg");
      setCameraOpen(false);
    } finally {
      setCapturing(false);
    }
  };

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setError(null);
      try {
        const { dataUri, mimeType } = await fileToBase64(file);
        onChange(dataUri, mimeType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      }
    }
    e.target.value = "";
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setError(null);
      try {
        const { dataUri, mimeType } = await fileToBase64(file);
        onChange(dataUri, mimeType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      }
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Product preview"
            className="h-48 w-48 rounded-lg border object-cover"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -right-2 -top-2 h-7 w-7"
            onClick={() => onClear?.()}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`flex h-48 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            }`}
          >
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <span className="text-sm font-medium">Click or drag image here</span>
            <span className="text-xs text-muted-foreground">JPEG, PNG, WebP — max 5MB</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={onFileInput}
            />
          </label>

          <Button type="button" variant="outline" onClick={() => setCameraOpen(true)}>
            <Camera className="mr-2 h-4 w-4" />
            Use camera
          </Button>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Take a picture</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border bg-black">
              <video
                ref={videoRef}
                className="h-[360px] w-full object-contain"
                playsInline
                muted
                autoPlay
              />
            </div>
            {cameraError && <p className="text-sm text-destructive">{cameraError}</p>}
            {!cameraError && !cameraReady && (
              <p className="text-sm text-muted-foreground">Starting camera preview…</p>
            )}
            {cameraReady && (
              <p className="text-sm text-muted-foreground">
                Position the item in frame, then tap Capture.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCameraOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void capture()}
              disabled={!cameraReady || capturing}
            >
              {capturing ? "Capturing…" : "Capture"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
