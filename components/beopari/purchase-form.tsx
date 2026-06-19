"use client";

import { useEffect, useMemo, useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatPKR, roundPKR, calculatePurchaseTotal } from "@/lib/currency-utils";

type CategoryOption = { id: string; name: string };

type CategoryLine = {
  categoryId: string;
  categoryName: string;
  totalWeight: number;
  quantity: number;
  costPerGram: number;
};

const emptyLine = (category: CategoryOption): CategoryLine => ({
  categoryId: category.id,
  categoryName: category.name,
  totalWeight: 0,
  quantity: 1,
  costPerGram: 0,
});

export function PurchaseForm({
  beopariId,
  onSaved,
}: {
  beopariId: string;
  onSaved: () => void;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [lines, setLines] = useState<Record<string, CategoryLine>>({});
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories?limit=100")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setCategories(d.data || []);
      })
      .catch(() => {});
  }, []);

  const selectedCategories = useMemo(
    () => categories.filter((c) => selectedCategoryIds.includes(c.id)),
    [categories, selectedCategoryIds]
  );

  const totalCostPreview = useMemo(
    () =>
      selectedCategories.reduce((acc, category) => {
        const line = lines[category.id];
        if (!line || line.totalWeight <= 0 || line.costPerGram < 0) return acc;
        return acc + calculatePurchaseTotal(line.totalWeight, line.costPerGram);
      }, 0),
    [selectedCategories, lines]
  );

  const canSubmit = useMemo(() => {
    if (submitting || selectedCategories.length === 0) return false;
    return selectedCategories.every((category) => {
      const line = lines[category.id];
      return (
        line &&
        line.totalWeight > 0 &&
        line.quantity >= 1 &&
        line.costPerGram >= 0
      );
    });
  }, [selectedCategories, lines, submitting]);

  const toggleCategory = (category: CategoryOption, checked: boolean) => {
    setSelectedCategoryIds((prev) => {
      if (checked) {
        if (prev.includes(category.id)) return prev;
        setLines((current) => ({
          ...current,
          [category.id]: current[category.id] ?? emptyLine(category),
        }));
        return [...prev, category.id];
      }
      return prev.filter((id) => id !== category.id);
    });
  };

  const updateLine = (
    categoryId: string,
    field: keyof Pick<CategoryLine, "totalWeight" | "quantity" | "costPerGram">,
    value: number
  ) => {
    setLines((prev) => {
      const existing = prev[categoryId];
      if (!existing) return prev;
      return {
        ...prev,
        [categoryId]: { ...existing, [field]: value },
      };
    });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const items = selectedCategories.map((category) => {
        const line = lines[category.id];
        return {
          categoryId: line.categoryId,
          categoryName: line.categoryName,
          totalWeight: line.totalWeight,
          quantity: line.quantity,
          costPerGram: line.costPerGram,
        };
      });

      const res = await fetch(`/api/beopari/${beopariId}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          purchaseDate,
          notes: notes || null,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Failed to create purchase");
        return;
      }
      onSaved();
    } catch {
      setError("Failed to create purchase");
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
        <Label>Categories *</Label>
        {categories.length > 0 ? (
          <div className="rounded-lg border p-3">
            <p className="mb-3 text-sm text-muted-foreground">
              Select all categories included in this purchase.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted/40"
                >
                  <input
                    type="checkbox"
                    checked={selectedCategoryIds.includes(category.id)}
                    onChange={(e) => toggleCategory(category, e.target.checked)}
                    disabled={submitting}
                    className="rounded border"
                  />
                  <span>{category.name}</span>
                </label>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No categories available.</p>
        )}
      </div>

      {selectedCategories.map((category) => {
        const line = lines[category.id] ?? emptyLine(category);
        const lineTotal =
          line.totalWeight > 0 && line.costPerGram >= 0
            ? roundPKR(line.totalWeight * line.costPerGram)
            : 0;

        return (
          <div key={category.id} className="space-y-4 rounded-lg border p-4">
            <h3 className="font-semibold">{category.name}</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Total weight (g) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.001"
                  value={line.totalWeight || ""}
                  onChange={(e) =>
                    updateLine(category.id, "totalWeight", Number(e.target.value))
                  }
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Quantity *</Label>
                <Input
                  type="number"
                  min={1}
                  step="1"
                  value={line.quantity || ""}
                  onChange={(e) => updateLine(category.id, "quantity", Number(e.target.value))}
                  disabled={submitting}
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Cost per gram (PKR) *</Label>
                <Input
                  type="number"
                  min={0}
                  step="0.01"
                  value={line.costPerGram || ""}
                  onChange={(e) =>
                    updateLine(category.id, "costPerGram", Number(e.target.value))
                  }
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <Label>Line total</Label>
                <div className="flex h-10 items-center rounded-md border bg-muted/30 px-3 text-sm font-medium">
                  {lineTotal > 0 ? formatPKR(lineTotal) : "—"}
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Purchase date</Label>
          <Input
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            disabled={submitting}
          />
        </div>
      </div>

      {totalCostPreview > 0 && (
        <p className="rounded-md border bg-muted/40 px-3 py-2 text-sm">
          Total cost preview:{" "}
          <span className="font-semibold">{formatPKR(totalCostPreview)}</span>
          {selectedCategories.length > 1 && (
            <span className="text-muted-foreground">
              {" "}
              ({selectedCategories.length} categories)
            </span>
          )}
        </p>
      )}

      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} disabled={submitting} />
      </div>

      <Button className="w-full" size="lg" onClick={handleSubmit} disabled={!canSubmit}>
        {submitting ? "Saving..." : "Create Purchase"}
      </Button>
    </div>
  );
}
