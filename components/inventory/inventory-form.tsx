"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImagePicker } from "@/components/inventory/image-picker";
import { BarcodePreview } from "@/components/inventory/barcode-preview";
import { generateSKU } from "@/lib/sku-utils";
import { formatPKR } from "@/lib/currency-utils";

const inventoryFormSchema = z.object({
  imageData: z.string().min(1, "Product image is required"),
  imageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  categoryId: z.string().min(1, "Category is required"),
  weightGrams: z.string().min(1, "Weight is required"),
  silverRateAtPurchase: z.string().min(1, "Silver rate is required"),
  hasStone: z.enum(["yes", "no"]),
  stoneType: z.string().optional(),
  quantity: z.string().min(1, "Quantity is required"),
  purchasePricePerGram: z.string().min(1, "Purchase price per gram is required"),
});

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface Category {
  id: string;
  name: string;
}

interface InventoryFormProps {
  categories: Category[];
  onSubmit: (data: {
    imageData: string;
    imageMimeType: "image/jpeg" | "image/png" | "image/webp";
    categoryId: string;
    weightGrams: number;
    silverRateAtPurchase: number;
    hasStone: boolean;
    stoneType: string | null;
    quantity: number;
    purchasePricePerGram: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function InventoryForm({ categories, onSubmit, isSubmitting = false }: InventoryFormProps) {
  const [rateDate, setRateDate] = useState("");
  const [rateLoading, setRateLoading] = useState(true);

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      imageData: "",
      imageMimeType: "image/jpeg",
      categoryId: "",
      weightGrams: "",
      silverRateAtPurchase: "",
      hasStone: "no",
      stoneType: "",
      quantity: "1",
      purchasePricePerGram: "",
    },
  });

  const imageData = form.watch("imageData");
  const imageMimeType = form.watch("imageMimeType");
  const categoryId = form.watch("categoryId");
  const weightGrams = form.watch("weightGrams");
  const purchasePricePerGram = form.watch("purchasePricePerGram");
  const hasStone = form.watch("hasStone");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const previewSku = selectedCategory ? generateSKU(selectedCategory.name, 1) : "";

  const purchasePricePerPiece = useMemo(() => {
    const weight = Number.parseFloat(weightGrams);
    const pricePerGram = Number.parseFloat(purchasePricePerGram);
    if (!Number.isFinite(weight) || !Number.isFinite(pricePerGram)) return 0;
    return Math.round(weight * pricePerGram * 100) / 100;
  }, [weightGrams, purchasePricePerGram]);

  useEffect(() => {
    fetch("/api/silver-rates/current")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          form.setValue("silverRateAtPurchase", String(data.data.ratePerGram));
          setRateDate(new Date(data.data.fetchedAt).toLocaleDateString());
        }
      })
      .finally(() => setRateLoading(false));
  }, [form]);

  const handleSubmit = async (values: InventoryFormValues) => {
    await onSubmit({
      imageData: values.imageData,
      imageMimeType: values.imageMimeType,
      categoryId: values.categoryId,
      weightGrams: Number.parseFloat(values.weightGrams),
      silverRateAtPurchase: Number.parseFloat(values.silverRateAtPurchase),
      hasStone: values.hasStone === "yes",
      stoneType: values.hasStone === "yes" ? values.stoneType || null : null,
      quantity: Number.parseInt(values.quantity, 10),
      purchasePricePerGram: Number.parseFloat(values.purchasePricePerGram),
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="imageData"
          render={() => (
            <FormItem>
              <FormLabel>Product Image *</FormLabel>
              <ImagePicker
                value={imageData}
                onChange={(dataUri, mimeType) => {
                  form.setValue("imageData", dataUri, { shouldValidate: true });
                  form.setValue("imageMimeType", mimeType as InventoryFormValues["imageMimeType"]);
                }}
                onClear={() => {
                  form.setValue("imageData", "");
                }}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="weightGrams"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Weight (grams) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.001" placeholder="e.g. 25.500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="silverRateAtPurchase"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Silver Rate (PKR/gram) *
                {rateDate && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Rate on {rateDate}
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder={rateLoading ? "Loading..." : "Silver rate"}
                  {...field}
                />
              </FormControl>
              <FormDescription>Auto-fetched from GoldPriceZ — editable before save</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasStone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stone</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasStone === "yes" && (
          <FormField
            control={form.control}
            name="stoneType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Stone Type</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Zircon, Onyx" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="quantity"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Quantity *</FormLabel>
              <FormControl>
                <Input type="number" min="1" step="1" {...field} />
              </FormControl>
              <FormDescription>
                Creates separate items, each with unique SKU and barcode
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="purchasePricePerGram"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Purchase Price per Gram (PKR) *</FormLabel>
              <FormControl>
                <Input type="number" step="0.01" placeholder="e.g. 200.00" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <Label>Purchase Price per Piece</Label>
          <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-medium">
            {purchasePricePerPiece > 0 ? formatPKR(purchasePricePerPiece) : "—"}
          </div>
          <p className="text-sm text-muted-foreground">
            Auto-calculated: price per gram × weight
          </p>
        </div>

        <div className="space-y-2">
          <Label>SKU Preview</Label>
          <div className="rounded-md border bg-muted/50 px-3 py-2 font-mono text-sm">
            {previewSku || "—"}
          </div>
          <p className="text-sm text-muted-foreground">
            Final SKUs assigned sequentially on save
          </p>
        </div>

        <div className="space-y-2">
          <Label>Barcode Preview</Label>
          <div className="rounded-md border bg-white p-4">
            <BarcodePreview value={previewSku} />
          </div>
        </div>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add to Inventory"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
