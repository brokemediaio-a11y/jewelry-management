"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatPKR } from "@/lib/currency-utils";
import { getImageSrc } from "@/lib/image-utils";
import { CartItem } from "@/stores/sale-session-store";

interface CartItemCardProps {
  item: CartItem;
  silverRateAtSale: number;
  onFinalPriceChange: (finalPrice: number) => void;
  onRemove: () => void;
}

export function CartItemCard({
  item,
  silverRateAtSale,
  onFinalPriceChange,
  onRemove,
}: CartItemCardProps) {
  return (
    <Card>
      <CardContent className="flex gap-4 p-4">
        <img
          src={getImageSrc(item.imageData)}
          alt={item.sku}
          className="h-20 w-20 shrink-0 rounded object-cover"
        />

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-mono text-sm font-semibold">{item.sku}</p>
              <p className="text-sm text-muted-foreground">
                {item.categoryName} · {item.weightGrams.toFixed(3)} g
                {item.stoneType ? ` · ${item.stoneType}` : ""}
              </p>
            </div>
            <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2">
            <span>Silver @ purchase: {formatPKR(item.silverRateAtPurchase)}/g</span>
            <span>Today&apos;s rate: {formatPKR(silverRateAtSale)}/g</span>
            <span>Quotient: ×{item.categoryQuotient}</span>
            <span>Purchase/piece: {formatPKR(item.purchasePricePerPiece)}</span>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Suggested price</p>
              <p className="font-medium">{formatPKR(item.suggestedSalePrice)}</p>
            </div>
            <div className="sm:w-40">
              <p className="mb-1 text-xs text-muted-foreground">Final price (PKR)</p>
              <Input
                type="number"
                min={0}
                step="0.01"
                value={item.finalPrice}
                onChange={(e) => onFinalPriceChange(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
