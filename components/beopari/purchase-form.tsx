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
import { formatPKR, roundPKR } from "@/lib/currency-utils";

type CategoryOption = { id: string; name: string };

export function PurchaseForm({
  beopariId,
  onSaved,
}: {
  beopariId: string;
  onSaved: () => void;
}) {
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [categoryId, setCategoryId] = useState<string>("");
  const [categoryName, setCategoryName] = useState("");
  const [totalWeight, setTotalWeight] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [costPerGram, setCostPerGram] = useState<number>(0);
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

  const totalCostPreview = useMemo(
    () =>
      totalWeight > 0 && costPerGram >= 0 ? roundPKR(totalWeight * costPerGram) : 0,
    [totalWeight, costPerGram]
  );

  const canSubmit =
    categoryName.trim().length > 0 &&
    totalWeight > 0 &&
    quantity >= 1 &&
    costPerGram >= 0 &&
    !submitting;

  const handleCategoryChange = (id: string) => {
    setCategoryId(id);
    const cat = categories.find((c) => c.id === id);
    if (cat) setCategoryName(cat.name);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/beopari/${beopariId}/purchases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: categoryId || null,
          categoryName,
          totalWeight,
          quantity,
          costPerGram,
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
        <Label>Category *</Label>
        {categories.length > 0 ? (
          <Select value={categoryId} onValueChange={handleCategoryChange} disabled={submitting}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
            disabled={submitting}
            placeholder="Category name"
          />
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Total weight (g) *</Label>
          <Input
            type="number"
            min={0}
            step="0.001"
            value={totalWeight || ""}
            onChange={(e) => setTotalWeight(Number(e.target.value))}
            disabled={submitting}
          />
        </div>
        <div className="space-y-2">
          <Label>Quantity *</Label>
          <Input
            type="number"
            min={1}
            step="1"
            value={quantity || ""}
            onChange={(e) => setQuantity(Number(e.target.value))}
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
            value={costPerGram || ""}
            onChange={(e) => setCostPerGram(Number(e.target.value))}
            disabled={submitting}
          />
        </div>
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
          Total cost preview: <span className="font-semibold">{formatPKR(totalCostPreview)}</span>
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
