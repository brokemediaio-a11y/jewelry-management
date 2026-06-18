"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPKR } from "@/lib/currency-utils";
import { useState } from "react";

interface CloseSaleDialogProps {
  open: boolean;
  remainingAmount: number;
  loading?: boolean;
  error?: string | null;
  onConfirm: (paymentMethod: string) => void;
  onCancel: () => void;
}

export function CloseSaleDialog({
  open,
  remainingAmount,
  loading = false,
  error,
  onConfirm,
  onCancel,
}: CloseSaleDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState("CASH");

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Custom Order</DialogTitle>
          <DialogDescription>
            Record remaining payment of {formatPKR(remainingAmount)} and mark this sale as
            completed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label>Payment method for remaining balance</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod} disabled={loading}>
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={() => onConfirm(paymentMethod)} disabled={loading}>
            {loading ? "Closing..." : "Close Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
