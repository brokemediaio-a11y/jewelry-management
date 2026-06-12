"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CustomerSelect } from "@/components/customers/customer-select";
import { SaleTypeSelector } from "@/components/sales/sale-type-selector";
import { CustomOrderFields } from "@/components/sales/custom-order-fields";
import { PaymentMethod, SaleType } from "@/stores/sale-session-store";

interface PricingPanelProps {
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
}

export function PricingPanel({
  customerId,
  saleType,
  paymentMethod,
  notes,
  advancePaid,
  pickupDate,
  finalTotal,
  itemCount,
  submitting = false,
  error,
  onCustomerChange,
  onSaleTypeChange,
  onPaymentMethodChange,
  onNotesChange,
  onAdvancePaidChange,
  onPickupDateChange,
  onSubmit,
}: PricingPanelProps) {
  const canSubmit = itemCount > 0 && customerId != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Customer, payment, and sale type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="space-y-2">
          <Label>Customer *</Label>
          <CustomerSelect
            value={customerId}
            onChange={(id) => onCustomerChange(id)}
            disabled={submitting}
          />
        </div>

        <SaleTypeSelector
          value={saleType}
          onChange={onSaleTypeChange}
          disabled={submitting}
        />

        {saleType === "CUSTOM_ORDER" && (
          <CustomOrderFields
            advancePaid={advancePaid}
            finalTotal={finalTotal}
            pickupDate={pickupDate}
            onAdvancePaidChange={onAdvancePaidChange}
            onPickupDateChange={onPickupDateChange}
            disabled={submitting}
          />
        )}

        <div className="space-y-2">
          <Label>Payment Method</Label>
          <Select
            value={paymentMethod}
            onValueChange={(v) => onPaymentMethodChange(v as PaymentMethod)}
            disabled={submitting}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">Cash</SelectItem>
              <SelectItem value="CARD">Card</SelectItem>
              <SelectItem value="UPI">UPI</SelectItem>
              <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
              <SelectItem value="CHEQUE">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            placeholder="Optional notes"
            value={notes}
            disabled={submitting}
            onChange={(e) => onNotesChange(e.target.value)}
          />
        </div>

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={!canSubmit || submitting}
          onClick={onSubmit}
        >
          {submitting ? "Processing..." : "Complete Sale"}
        </Button>
      </CardContent>
    </Card>
  );
}
