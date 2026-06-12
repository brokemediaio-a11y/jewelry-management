"use client";

import { useEffect, useState } from "react";
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
import { InventoryForm } from "@/components/inventory/inventory-form";

interface Category {
  id: string;
  name: string;
}

export default function NewInventoryPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/categories?limit=100")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setCategories(data.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (data: {
    imageData: string;
    imageMimeType: "image/jpeg" | "image/png" | "image/webp";
    categoryId: string;
    weightGrams: number;
    silverRateAtPurchase: number;
    hasStone: boolean;
    stoneType: string | null;
    quantity: number;
    purchasePricePerGram: number;
  }) => {
    setSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await fetch("/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (result.success) {
        const count = result.data.created;
        setSuccessMessage(
          `Successfully added ${count} item${count > 1 ? "s" : ""} to inventory`
        );
        setTimeout(() => router.push("/dashboard/inventory"), 1500);
      } else {
        setError(result.error || "Failed to add inventory");
      }
    } catch {
      setError("An error occurred while saving");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/inventory">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Inventory</h1>
          <p className="text-muted-foreground">
            Image, category, weight, silver rate, stone, quantity, and pricing
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Inventory Item</CardTitle>
          <CardDescription>
            Quantity creates separate items, each with a unique SKU and barcode
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading categories...</p>
          ) : categories.length === 0 ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                No categories found. Create a category first.
              </p>
              <Button asChild variant="outline">
                <Link href="/dashboard/categories">Go to Categories</Link>
              </Button>
            </div>
          ) : (
            <>
              {error && <p className="mb-4 text-sm text-destructive">{error}</p>}
              {successMessage && (
                <p className="mb-4 text-sm text-green-600">{successMessage}</p>
              )}
              <InventoryForm
                categories={categories}
                onSubmit={handleSubmit}
                isSubmitting={submitting}
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
