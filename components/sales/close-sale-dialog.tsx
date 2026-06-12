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
import { formatPKR } from "@/lib/currency-utils";

interface CloseSaleDialogProps {
  open: boolean;
  remainingAmount: number;
  loading?: boolean;
  error?: string | null;
  onConfirm: () => void;
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
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Close Custom Order</DialogTitle>
          <DialogDescription>
            Record remaining payment of {formatPKR(remainingAmount)} and mark this
            sale as completed?
          </DialogDescription>
        </DialogHeader>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading ? "Closing..." : "Close Sale"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
