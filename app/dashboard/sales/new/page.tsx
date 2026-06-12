"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BarcodeScanner } from "@/components/sales/barcode-scanner";
import { SkuInput } from "@/components/sales/sku-input";
import { SaleCart } from "@/components/sales/sale-cart";
import { PricingPanel } from "@/components/sales/pricing-panel";
import {
  DEFAULT_PRICING_CONFIG,
  type PricingConfig,
} from "@/lib/pricing-config";
import { getMinSalePrice, getQualityQuotient } from "@/lib/pricing-engine";
import { formatPKR } from "@/lib/currency-utils";
import { useSaleSessionStore } from "@/stores/sale-session-store";

export default function NewSalePage() {
  const router = useRouter();
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pricingConfig, setPricingConfig] = useState<PricingConfig>(
    DEFAULT_PRICING_CONFIG
  );

  const {
    cartItems,
    silverRateAtSale,
    customerId,
    saleType,
    advancePaid,
    pickupDate,
    paymentMethod,
    notes,
    setSilverRateAtSale,
    addToCart,
    removeFromCart,
    clearCart,
    updateItemFinalPrice,
    getSuggestedTotal,
    getFinalTotal,
    setCustomerId,
    setSaleType,
    setAdvancePaid,
    setPickupDate,
    setPaymentMethod,
    setNotes,
    reset,
  } = useSaleSessionStore();

  useEffect(() => {
    fetch("/api/silver-rates/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setSilverRateAtSale(data.data.ratePerGram);
        }
      });

    fetch("/api/settings/pricing")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setPricingConfig(data.data);
        }
      });
  }, [setSilverRateAtSale]);

  const handleLookup = useCallback(
    async (value: string, type: "sku" | "barcode" = "sku") => {
      setLookupLoading(true);
      setLookupError(null);

      try {
        const param = type === "barcode" ? `barcode=${encodeURIComponent(value)}` : `sku=${encodeURIComponent(value)}`;
        const res = await fetch(`/api/inventory/lookup?${param}`);
        const data = await res.json();

        if (!data.success) {
          setLookupError(data.error || "Item not found");
          return;
        }

        const item = data.data;
        const added = addToCart({
          inventoryItemId: item.id,
          sku: item.sku,
          barcode: item.barcode,
          imageData: item.imageData,
          categoryName: item.category?.name || "",
          weightGrams: item.weightGrams,
          itemQuality: item.itemQuality,
          stoneSummary: item.stoneSummary ?? null,
          stonePrice: item.stonePrice ?? null,
          silverRateAtPurchase: item.silverRateAtPurchase,
          purchasePricePerPiece: item.purchasePricePerPiece,
          qualityQuotient: item.qualityQuotient ?? getQualityQuotient(
            item.itemQuality,
            pricingConfig
          ),
          suggestedSalePrice: item.suggestedSalePrice,
          finalPrice: item.suggestedSalePrice,
        });

        if (!added) {
          setLookupError("This item is already in the cart");
        }
      } catch {
        setLookupError("Failed to lookup item");
      } finally {
        setLookupLoading(false);
      }
    },
    [addToCart, pricingConfig]
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);

    const belowMin = cartItems.find(
      (item) => item.finalPrice < getMinSalePrice(item.purchasePricePerPiece)
    );
    if (belowMin) {
      setSubmitError(
        `Final price for ${belowMin.sku} cannot be less than purchase price (${formatPKR(belowMin.purchasePricePerPiece)})`
      );
      setSubmitting(false);
      return;
    }

    try {
      const body: Record<string, unknown> = {
        items: cartItems.map((c) => ({
          inventoryItemId: c.inventoryItemId,
          finalPrice: c.finalPrice,
        })),
        saleType,
        customerId,
        paymentMethod,
        notes: notes || null,
      };

      if (saleType === "CUSTOM_ORDER") {
        body.advancePaid = advancePaid;
        body.pickupDate = pickupDate;
      }

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        reset();
        router.push(`/dashboard/sales/${data.data.id}`);
      } else {
        setSubmitError(data.error || "Failed to complete sale");
      }
    } catch {
      setSubmitError("An error occurred while completing the sale");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/sales">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Sale</h1>
          <p className="text-muted-foreground">
            Scan barcode or enter SKU to add items to cart
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Items</CardTitle>
              <CardDescription>
                Silver rate at sale: Rs. {silverRateAtSale.toFixed(2)}/g
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {lookupError && (
                <Alert variant="destructive">
                  <AlertDescription>{lookupError}</AlertDescription>
                </Alert>
              )}

              <SkuInput
                onLookup={(sku) => handleLookup(sku, "sku")}
                loading={lookupLoading}
              />

              <BarcodeScanner
                onScan={(value) => handleLookup(value, "barcode")}
                onError={setLookupError}
                disabled={lookupLoading}
              />
            </CardContent>
          </Card>

          <SaleCart
            items={cartItems}
            silverRateAtSale={silverRateAtSale}
            suggestedTotal={getSuggestedTotal()}
            finalTotal={getFinalTotal()}
            onFinalPriceChange={updateItemFinalPrice}
            onRemove={removeFromCart}
            onClear={clearCart}
          />
        </div>

        <div>
          <PricingPanel
            customerId={customerId}
            saleType={saleType}
            paymentMethod={paymentMethod}
            notes={notes}
            advancePaid={advancePaid}
            pickupDate={pickupDate}
            finalTotal={getFinalTotal()}
            itemCount={cartItems.length}
            submitting={submitting}
            error={submitError}
            onCustomerChange={setCustomerId}
            onSaleTypeChange={setSaleType}
            onPaymentMethodChange={setPaymentMethod}
            onNotesChange={setNotes}
            onAdvancePaidChange={setAdvancePaid}
            onPickupDateChange={setPickupDate}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    </div>
  );
}
