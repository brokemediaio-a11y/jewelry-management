"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ExpenseTypeSegment, type ExpenseTypeValue } from "@/components/expenses/expense-type-segment";
import { useToast } from "@/components/ui/toaster";

type ExpenseType = "BEOPARI" | "KAREGAR" | "SHOP" | "HOME";
type PaymentMethod = "CASH" | "CARD" | "UPI" | "BANK_TRANSFER" | "CHEQUE";

type AllocationRow = { targetId: string; amount: number };

type SimpleOption = { id: string; label: string };
type ListApiResponse<T> = { success: boolean; data?: T; error?: string };

export function ExpenseForm({
  expenseId,
  onSaved,
  defaultValues,
}: {
  expenseId?: string;
  onSaved?: (expenseId: string) => void;
  defaultValues?: Partial<{
    expenseType: ExpenseType;
    paymentMethod: PaymentMethod;
    expenseDate: string;
    description: string;
    amount: number;
    beopariId: string | null;
    karegarId: string | null;
    purchaseId: string | null;
    allocations: AllocationRow[];
  }>;
}) {
  const { toast } = useToast();
  const [expenseType, setExpenseType] = useState<ExpenseType>(
    defaultValues?.expenseType || "SHOP"
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    defaultValues?.paymentMethod || "CASH"
  );
  const [expenseDate, setExpenseDate] = useState<string>(
    defaultValues?.expenseDate || new Date().toISOString().slice(0, 10)
  );
  const [amount, setAmount] = useState<number>(defaultValues?.amount || 0);
  const [description, setDescription] = useState<string>(defaultValues?.description || "");

  const [beopariId, setBeopariId] = useState<string | null>(defaultValues?.beopariId ?? null);
  const [karegarId, setKaregarId] = useState<string | null>(defaultValues?.karegarId ?? null);
  const [allocations, setAllocations] = useState<AllocationRow[]>(defaultValues?.allocations || []);

  const [beopariOptions, setBeopariOptions] = useState<SimpleOption[]>([]);
  const [karegarOptions, setKaregarOptions] = useState<SimpleOption[]>([]);
  const [targets, setTargets] = useState<SimpleOption[]>([]);

  const [pendingPurchaseId] = useState<string | null>(defaultValues?.purchaseId ?? null);
  const [purchasePrefilled, setPurchasePrefilled] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allocationsTotal = useMemo(
    () => allocations.reduce((acc, a) => acc + Number(a.amount || 0), 0),
    [allocations]
  );

  const showDescriptionRequired = expenseType === "SHOP" || expenseType === "HOME";
  const showBeopari = expenseType === "BEOPARI";
  const showKaregar = expenseType === "KAREGAR";
  const showAllocations = showBeopari || showKaregar;

  useEffect(() => {
    // lazy-load lists only when needed
    if (showBeopari) {
      fetch("/api/beopari?limit=100")
        .then((r) => r.json())
        .then((d: ListApiResponse<Array<{ id: string; name: string }>>) => {
          if (d.success) {
            setBeopariOptions((d.data || []).map((b) => ({ id: b.id, label: b.name })));
          }
        })
        .catch(() => {});
    }
    if (showKaregar) {
      fetch("/api/karegar?limit=100")
        .then((r) => r.json())
        .then((d: ListApiResponse<Array<{ id: string; name: string }>>) => {
          if (d.success) {
            setKaregarOptions((d.data || []).map((k) => ({ id: k.id, label: k.name })));
          }
        })
        .catch(() => {});
    }
  }, [showBeopari, showKaregar]);

  useEffect(() => {
    if (!expenseId) {
      setTargets([]);
      setAllocations([]);
    }

    if (showBeopari && beopariId) {
      const openOnly = expenseId ? "" : "&onlyOpen=1";
      fetch(`/api/beopari/${beopariId}/purchases?limit=100${openOnly}`)
        .then((r) => r.json())
        .then(
          (
            d: ListApiResponse<
              Array<{ id: string; categoryName: string; remainingAmount: number }>
            >
          ) => {
          if (d.success) {
            setTargets(
              (d.data || []).map((p) => ({
                id: p.id,
                label: `${p.categoryName} — Remaining ${p.remainingAmount}`,
              }))
            );
          }
        })
        .catch(() => {});
    }

    if (showKaregar && karegarId) {
      fetch(`/api/workshop-orders?limit=100&karegarId=${karegarId}`)
        .then((r) => r.json())
        .then(
          (
            d: ListApiResponse<
              Array<{
                id: string;
                status: string;
                sale?: { invoiceNumber: string | null } | null;
              }>
            >
          ) => {
          if (d.success) {
            setTargets(
              (d.data || []).map((o) => ({
                id: o.id,
                label: `${o.sale?.invoiceNumber || "—"} — ${o.status}`,
              }))
            );
          }
        })
        .catch(() => {});
    }
  }, [showBeopari, showKaregar, beopariId, karegarId, expenseId]);

  useEffect(() => {
    if (purchasePrefilled || !pendingPurchaseId || !targets.length) return;
    const target = targets.find((t) => t.id === pendingPurchaseId);
    if (!target) return;
    const match = target.label.match(/Remaining ([\d.]+)/);
    const remaining = match ? Number(match[1]) : 0;
    setAllocations([{ targetId: pendingPurchaseId, amount: remaining }]);
    if (remaining > 0) setAmount(remaining);
    setPurchasePrefilled(true);
  }, [pendingPurchaseId, targets, purchasePrefilled]);

  useEffect(() => {
    if (expenseId && defaultValues?.allocations?.length) {
      setAllocations(defaultValues.allocations);
    }
  }, [expenseId, defaultValues?.allocations]);

  const addAllocation = (targetId: string) => {
    if (!targetId) return;
    if (allocations.some((a) => a.targetId === targetId)) return;
    setAllocations((prev) => [...prev, { targetId, amount: 0 }]);
  };

  const autoFillAllocations = () => {
    if (!amount || amount <= 0 || !targets.length) return;
    setAllocations([{ targetId: targets[0].id, amount }]);
  };

  const canSubmit = useMemo(() => {
    if (amount <= 0) return false;
    if (!expenseDate) return false;
    if (showDescriptionRequired && description.trim().length < 10) return false;
    if (showBeopari && !beopariId) return false;
    if (showKaregar && !karegarId) return false;
    if (showAllocations) {
      if (!allocations.length) return false;
      if (Math.abs(allocationsTotal - amount) > 0.009) return false;
    }
    return !submitting;
  }, [
    amount,
    expenseDate,
    description,
    showDescriptionRequired,
    showBeopari,
    showKaregar,
    showAllocations,
    beopariId,
    karegarId,
    allocations.length,
    allocationsTotal,
    submitting,
  ]);

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(expenseId ? `/api/expenses/${expenseId}` : "/api/expenses", {
        method: expenseId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expenseType,
          amount,
          expenseDate,
          paymentMethod,
          description: description || null,
          beopariId,
          karegarId,
          allocations: allocations.map((a) => ({ targetId: a.targetId, amount: a.amount })),
        }),
      });

      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to save expense");
        return;
      }

      onSaved?.(data.data.id);
      toast({
        title: expenseId ? "Expense updated" : "Expense recorded",
        variant: "success",
      });
    } catch {
      setError("Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label>Expense type *</Label>
        <ExpenseTypeSegment
          value={expenseType as ExpenseTypeValue}
          onChange={(v) => {
            setExpenseType(v);
            setBeopariId(null);
            setKaregarId(null);
            setAllocations([]);
          }}
          disabled={submitting}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Amount (PKR) *</Label>
          <Input
            type="number"
            min={0}
            step="0.01"
            value={amount || ""}
            onChange={(e) => setAmount(Number(e.target.value))}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label>Date *</Label>
          <Input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

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

      {showBeopari && (
        <div className="space-y-2">
          <Label>Beopari *</Label>
          <Select value={beopariId || ""} onValueChange={(v) => setBeopariId(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select beopari" />
            </SelectTrigger>
            <SelectContent>
              {beopariOptions.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {showKaregar && (
        <div className="space-y-2">
          <Label>Karegar *</Label>
          <Select value={karegarId || ""} onValueChange={(v) => setKaregarId(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder="Select karegar" />
            </SelectTrigger>
            <SelectContent>
              {karegarOptions.map((k) => (
                <SelectItem key={k.id} value={k.id}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {(expenseType === "SHOP" || expenseType === "HOME") && (
        <div className="space-y-2">
          <Label>Description / justification *</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            disabled={submitting}
            placeholder="Explain this expense (required)"
          />
        </div>
      )}

      {showAllocations && (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium">Allocations *</p>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">
                Total: {allocationsTotal.toFixed(2)} / {amount.toFixed(2)}
              </p>
              {targets.length > 0 && amount > 0 && (
                <Button type="button" variant="outline" size="sm" onClick={autoFillAllocations}>
                  Auto-fill
                </Button>
              )}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Add target</Label>
              <Select onValueChange={(v) => addAllocation(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {targets.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            {allocations.map((a) => (
              <div key={a.targetId} className="flex items-center gap-2">
                <div className="flex-1 text-sm text-muted-foreground">
                  {targets.find((t) => t.id === a.targetId)?.label || a.targetId}
                </div>
                <Input
                  className="w-32"
                  type="number"
                  min={0}
                  step="0.01"
                  value={a.amount || ""}
                  onChange={(e) => {
                    const next = Number(e.target.value);
                    setAllocations((prev) =>
                      prev.map((row) => (row.targetId === a.targetId ? { ...row, amount: next } : row))
                    );
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setAllocations((prev) => prev.filter((row) => row.targetId !== a.targetId))}
                >
                  Remove
                </Button>
              </div>
            ))}
            {!allocations.length && (
              <p className="text-sm text-muted-foreground">Select one or more targets to allocate this payment.</p>
            )}
          </div>
        </div>
      )}

      <Button type="button" className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? "Saving..." : expenseId ? "Update Expense" : "Save Expense"}
      </Button>
    </div>
  );
}

