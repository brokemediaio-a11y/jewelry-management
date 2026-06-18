"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SkuInputProps {
  onLookup: (sku: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SkuInput({ onLookup, loading = false, disabled = false }: SkuInputProps) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const trimmed = value.trim();
    if (!trimmed || loading || disabled) return;
    onLookup(trimmed);
    setValue("");
  };

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Enter SKU or scan barcode..."
          value={value}
          disabled={disabled || loading}
          autoFocus
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
      </div>
      <Button
        type="button"
        onClick={handleSubmit}
        disabled={!value.trim() || loading || disabled}
      >
        {loading ? "Looking up..." : "Add"}
      </Button>
    </div>
  );
}
