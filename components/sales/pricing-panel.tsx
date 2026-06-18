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
import { formatPKR } from "@/lib/currency-utils";
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
  embedded?: boolean;
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
  embedded = false,
  onCustomerChange,
  onSaleTypeChange,
  onPaymentMethodChange,
  onNotesChange,
  onAdvancePaidChange,
  onPickupDateChange,
  onSubmit,
}: PricingPanelProps) {
  const canSubmit = itemCount > 0 && customerId != null;

  const content = (
    <div className="space-y-4">
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

      {!canSubmit && itemCount === 0 && (
        <p className="text-xs text-muted-foreground">Add at least one item to continue.</p>
      )}
      {!canSubmit && itemCount > 0 && !customerId && (
        <p className="text-xs text-muted-foreground">Select a customer to continue.</p>
      )}

      <div className="rounded-lg border bg-muted/40 p-3 text-right">
        <p className="text-sm text-muted-foreground">Final total</p>
        <p className="text-2xl font-bold tabular-nums">{formatPKR(finalTotal)}</p>
      </div>

      <Button
        type="button"
        className="w-full"
        variant="bronze"
        size="lg"
        disabled={!canSubmit || submitting}
        onClick={onSubmit}
      >
        {submitting
          ? "Processing..."
          : saleType === "CUSTOM_ORDER"
            ? "Create Custom Order"
            : "Complete Sale"}
      </Button>
    </div>
  );

  if (embedded) return content;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Checkout</CardTitle>
        <CardDescription>Customer, payment, and sale type</CardDescription>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
