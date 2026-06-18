"use client";

import { Button } from "@/components/ui/button";

export type SaleMode = "inventory" | "external";

export function SaleModeSwitch({
  value,
  onChange,
  disabled = false,
}: {
  value: SaleMode;
  onChange: (mode: SaleMode) => void;
  disabled?: boolean;
}) {
  return (
    <div className="inline-flex rounded-lg border p-1">
      <Button
        type="button"
        variant={value === "inventory" ? "default" : "ghost"}
        size="sm"
        disabled={disabled}
        onClick={() => onChange("inventory")}
      >
        In Inventory
      </Button>
      <Button
        type="button"
        variant={value === "external" ? "default" : "ghost"}
        size="sm"
        disabled={disabled}
        onClick={() => onChange("external")}
      >
        Not in Inventory
      </Button>
    </div>
  );
}

