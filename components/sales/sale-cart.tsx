"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatPKR } from "@/lib/currency-utils";
import { CartItem } from "@/stores/sale-session-store";
import { CartItemCard } from "@/components/sales/cart-item-card";

interface SaleCartProps {
  items: CartItem[];
  silverRateAtSale: number;
  suggestedTotal: number;
  finalTotal: number;
  onFinalPriceChange: (inventoryItemId: string, finalPrice: number) => void;
  onRemove: (inventoryItemId: string) => void;
  onClear: () => void;
}

export function SaleCart({
  items,
  silverRateAtSale,
  suggestedTotal,
  finalTotal,
  onFinalPriceChange,
  onRemove,
  onClear,
}: SaleCartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Cart ({items.length} items)</CardTitle>
          <CardDescription>
            Adjust final price per item before checkout
          </CardDescription>
        </div>
        {items.length > 0 && (
          <Button type="button" variant="outline" size="sm" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear Cart
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Scan a barcode or enter a SKU to add items
          </p>
        ) : (
          <>
            <div className="space-y-3">
              {items.map((item) => (
                <CartItemCard
                  key={item.inventoryItemId}
                  item={item}
                  silverRateAtSale={silverRateAtSale}
                  onFinalPriceChange={(price) =>
                    onFinalPriceChange(item.inventoryItemId, price)
                  }
                  onRemove={() => onRemove(item.inventoryItemId)}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end sm:gap-8">
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Suggested total</p>
                <p className="text-lg font-medium">{formatPKR(suggestedTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Final total</p>
                <p className="text-xl font-bold">{formatPKR(finalTotal)}</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
