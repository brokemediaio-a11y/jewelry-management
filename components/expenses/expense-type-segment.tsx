"use client";

import { HandCoins, Hammer, Home, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type ExpenseTypeValue = "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";

const OPTIONS: Array<{
  value: ExpenseTypeValue;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { value: "SHOP", label: "Shop", icon: Store },
  { value: "HOME", label: "Home", icon: Home },
  { value: "BEOPARI", label: "Beopari", icon: HandCoins },
  { value: "KAREGAR", label: "Karegar", icon: Hammer },
];

export function ExpenseTypeSegment({
  value,
  onChange,
  disabled,
}: {
  value: ExpenseTypeValue;
  onChange: (value: ExpenseTypeValue) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = value === opt.value;
        return (
          <Button
            key={opt.value}
            type="button"
            variant={active ? "default" : "outline"}
            className={cn(
              "h-auto flex-col gap-1 py-3",
              active && "bg-brand-bronze hover:bg-brand-bronze/90 text-white"
            )}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{opt.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
