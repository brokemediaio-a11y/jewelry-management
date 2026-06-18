"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PricingPanel } from "@/components/sales/pricing-panel";
import { formatPKR } from "@/lib/currency-utils";
import type { PaymentMethod, SaleType } from "@/stores/sale-session-store";

type MobileCheckoutSheetProps = {
  customerId: string | null;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  notes: string;
  advancePaid: number;
  pickupDate: string | null;
  finalTotal: number;
  itemCount: number;
  submitting?: boolean;
  error?: string | null;
  onCustomerChange: (id: string | null) => void;
  onSaleTypeChange: (type: SaleType) => void;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  onNotesChange: (notes: string) => void;
  onAdvancePaidChange: (amount: number) => void;
  onPickupDateChange: (date: string) => void;
  onSubmit: () => void;
};

export function MobileCheckoutSheet(props: MobileCheckoutSheetProps) {
  const [open, setOpen] = useState(false);
  const canOpen = props.itemCount > 0;

  const handleSubmit = () => {
    props.onSubmit();
    setOpen(false);
  };

  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-40 border-t bg-background p-3 shadow-lg lg:hidden">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">
              {props.itemCount} item{props.itemCount !== 1 ? "s" : ""}
            </p>
            <p className="text-lg font-bold tabular-nums">{formatPKR(props.finalTotal)}</p>
          </div>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                size="lg"
                disabled={!canOpen}
                variant="bronze"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Checkout
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl pb-8">
              <SheetHeader>
                <SheetTitle>Checkout</SheetTitle>
              </SheetHeader>
              <div className="px-4 pb-4">
                <PricingPanel {...props} embedded onSubmit={handleSubmit} />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
      <div className="h-20 lg:hidden" aria-hidden />
    </>
  );
}
