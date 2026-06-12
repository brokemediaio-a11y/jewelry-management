"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SaleType } from "@/stores/sale-session-store";

interface SaleTypeSelectorProps {
  value: SaleType;
  onChange: (value: SaleType) => void;
  disabled?: boolean;
}

export function SaleTypeSelector({
  value,
  onChange,
  disabled = false,
}: SaleTypeSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Sale Type</Label>
      <Select
        value={value}
        onValueChange={(v) => onChange(v as SaleType)}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="PURCHASE">Purchase (immediate)</SelectItem>
          <SelectItem value="CUSTOM_ORDER">Custom Order</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
