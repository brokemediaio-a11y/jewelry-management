"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatPKR } from "@/lib/currency-utils";

interface CustomOrderFieldsProps {
  advancePaid: number;
  finalTotal: number;
  pickupDate: string | null;
  onAdvancePaidChange: (value: number) => void;
  onPickupDateChange: (value: string) => void;
  disabled?: boolean;
}

export function CustomOrderFields({
  advancePaid,
  finalTotal,
  pickupDate,
  onAdvancePaidChange,
  onPickupDateChange,
  disabled = false,
}: CustomOrderFieldsProps) {
  const remaining = Math.max(0, finalTotal - advancePaid);

  return (
    <div className="space-y-4 rounded-lg border bg-muted/30 p-4">
      <p className="text-sm font-medium">Custom Order Details</p>

      <div className="space-y-2">
        <Label htmlFor="advancePaid">Advance Paid (PKR)</Label>
        <Input
          id="advancePaid"
          type="number"
          min={0}
          step="0.01"
          value={advancePaid || ""}
          disabled={disabled}
          onChange={(e) => onAdvancePaidChange(Number(e.target.value))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pickupDate">Pickup Date</Label>
        <Input
          id="pickupDate"
          type="date"
          value={pickupDate || ""}
          disabled={disabled}
          onChange={(e) => onPickupDateChange(e.target.value)}
        />
      </div>

      <div className="text-sm">
        <span className="text-muted-foreground">Remaining amount: </span>
        <span className="font-semibold">{formatPKR(remaining)}</span>
      </div>
    </div>
  );
}
