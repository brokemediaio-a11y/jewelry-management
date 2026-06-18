"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CustomerSelect } from "@/components/customers/customer-select";
import { ImagePicker } from "@/components/inventory/image-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/lib/currency-utils";

type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

export function ExternalOrderForm() {
  const router = useRouter();

  const [customerId, setCustomerId] = useState<string | null>(null);
  const [sampleImageData, setSampleImageData] = useState<string>("");
  const [sampleImageMimeType, setSampleImageMimeType] = useState<string>("");
  const [orderDescription, setOrderDescription] = useState("");
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [advancePaid, setAdvancePaid] = useState<number>(0);
  const [pickupDate, setPickupDate] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = useMemo(
    () => Math.max(0, (finalPrice || 0) - (advancePaid || 0)),
    [finalPrice, advancePaid]
  );

  const canSubmit =
    customerId != null &&
    Boolean(sampleImageData) &&
    Boolean(sampleImageMimeType) &&
    orderDescription.trim().length >= 10 &&
    finalPrice > 0 &&
    advancePaid > 0 &&
    pickupDate.length > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "EXTERNAL",
          saleType: "CUSTOM_ORDER",
          customerId,
          sampleImageData,
          sampleImageMimeType,
          orderDescription,
          finalPrice,
          advancePaid,
          pickupDate,
          paymentMethod,
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/dashboard/sales/${data.data.id}`);
      } else {
        setError(data.error || "Failed to create order");
      }
    } catch {
      setError("Failed to create order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>External Custom Order</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Customer *</Label>
          <CustomerSelect value={customerId} onChange={setCustomerId} disabled={submitting} />
        </div>

        <div className="space-y-2">
          <Label>Sample image *</Label>
          <ImagePicker
            value={sampleImageData ? `data:${sampleImageMimeType};base64,${sampleImageData}` : undefined}
            onChange={(dataUri, mime) => {
              // dataUri is already a full data URI; our API stores base64 only
              const parts = dataUri.split(",");
              setSampleImageMimeType(mime);
              setSampleImageData(parts[1] || "");
            }}
            onClear={() => {
              setSampleImageData("");
              setSampleImageMimeType("");
            }}
          />
        </div>

        <div className="space-y-2">
          <Label>Order description *</Label>
          <Textarea
            value={orderDescription}
            disabled={submitting}
            placeholder="Write all job details here (size, design, stone, etc.)"
            onChange={(e) => setOrderDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Final sale price (PKR) *</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={finalPrice || ""}
            disabled={submitting}
            onChange={(e) => setFinalPrice(Number(e.target.value))}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Advance paid (PKR) *</Label>
            <Input
              type="number"
              min={0}
              step="0.01"
              value={advancePaid || ""}
              disabled={submitting}
              onChange={(e) => setAdvancePaid(Number(e.target.value))}
            />
          </div>

          <div className="space-y-2">
            <Label>Pickup date *</Label>
            <Input
              type="date"
              value={pickupDate}
              disabled={submitting}
              onChange={(e) => setPickupDate(e.target.value)}
            />
          </div>
        </div>

        <div className="text-sm">
          <span className="text-muted-foreground">Remaining amount: </span>
          <span className="font-semibold">{formatPKR(remaining)}</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Payment method</Label>
            <Select
              value={paymentMethod}
              onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
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
        </div>

        <div className="space-y-2">
          <Label>Notes</Label>
          <Textarea
            value={notes}
            disabled={submitting}
            placeholder="Additional notes (optional)"
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button type="button" className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? "Creating..." : "Create Custom Order"}
        </Button>
      </CardContent>
    </Card>
  );
}

