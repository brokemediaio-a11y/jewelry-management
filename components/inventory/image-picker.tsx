"use client";

import { useCallback, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fileToBase64 } from "@/lib/image-utils";

interface ImagePickerProps {
  value?: string;
  onChange: (dataUri: string, mimeType: string) => void;
  onClear?: () => void;
}

export function ImagePicker({ value, onChange, onClear }: ImagePickerProps) {
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      try {
        const { dataUri, mimeType } = await fileToBase64(file);
        onChange(dataUri, mimeType);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load image");
      }
    },
    [onChange]
  );

  const onFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await handleFile(file);
    e.target.value = "";
  };

  const onDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await handleFile(file);
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
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
