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
import { useEffectiveSilverRate, useSilverRateStore } from "@/stores/silver-rate-store";

const inventoryFormSchema = z
  .object({
    imageData: z.string().min(1, "Product image is required"),
    imageMimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
    categoryId: z.string().min(1, "Category is required"),
    itemQuality: z.enum(["PREMIUM", "LOCAL"], {
      message: "Item quality is required",
    }),
    hasStoneConfig: z.enum(["yes", "no"]),
    stoneTypeId: z.string().optional(),
    stoneColorId: z.string().optional(),
    stoneCutId: z.string().optional(),
    stoneClarityId: z.string().optional(),
    stonePrice: z.string().optional(),
    weightGrams: z.string().min(1, "Weight is required"),
    silverRateAtPurchase: z.string().min(1, "Silver rate is required"),
    quantity: z.string().min(1, "Quantity is required"),
    purchasePricePerGram: z.string().min(1, "Purchase price per gram is required"),
  })
  .superRefine((data, ctx) => {
    if (data.hasStoneConfig !== "yes") return;

    if (!data.stoneTypeId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stone type is required", path: ["stoneTypeId"] });
    }
    if (!data.stoneColorId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stone color is required", path: ["stoneColorId"] });
    }
    if (!data.stoneCutId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stone cut is required", path: ["stoneCutId"] });
    }
    if (!data.stoneClarityId) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stone clarity is required", path: ["stoneClarityId"] });
    }
    const price = Number.parseFloat(data.stonePrice || "");
    if (!Number.isFinite(price) || price < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Stone price is required", path: ["stonePrice"] });
    }
  });

type InventoryFormValues = z.infer<typeof inventoryFormSchema>;

interface Category {
  id: string;
  name: string;
}

interface StoneOption {
  id: string;
  name: string;
}

interface StoneOptionsGrouped {
  types: StoneOption[];
  colors: StoneOption[];
  cuts: StoneOption[];
  clarities: StoneOption[];
}

interface InventoryFormProps {
  categories: Category[];
  onSubmit: (data: {
    imageData: string;
    imageMimeType: "image/jpeg" | "image/png" | "image/webp";
    categoryId: string;
    itemQuality: "PREMIUM" | "LOCAL";
    hasStoneConfig: boolean;
    stoneTypeId: string | null;
    stoneColorId: string | null;
    stoneCutId: string | null;
    stoneClarityId: string | null;
    stonePrice: number | null;
    weightGrams: number;
    silverRateAtPurchase: number;
    quantity: number;
    purchasePricePerGram: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

export function InventoryForm({ categories, onSubmit, isSubmitting = false }: InventoryFormProps) {
  const [rateDate, setRateDate] = useState("");
  const [rateLoading, setRateLoading] = useState(true);
  const [stonesLoading, setStonesLoading] = useState(true);
  const [stoneOptions, setStoneOptions] = useState<StoneOptionsGrouped>({
    types: [],
    colors: [],
    cuts: [],
    clarities: [],
  });

  const form = useForm<InventoryFormValues>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: {
      imageData: "",
      imageMimeType: "image/jpeg",
      categoryId: "",
      itemQuality: undefined,
      hasStoneConfig: "no",
      stoneTypeId: "",
      stoneColorId: "",
      stoneCutId: "",
      stoneClarityId: "",
      stonePrice: "",
      weightGrams: "",
      silverRateAtPurchase: "",
      quantity: "1",
      purchasePricePerGram: "",
    },
  });

  const imageData = form.watch("imageData");
  const imageMimeType = form.watch("imageMimeType");
  const categoryId = form.watch("categoryId");
  const weightGrams = form.watch("weightGrams");
  const purchasePricePerGram = form.watch("purchasePricePerGram");
  const hasStoneConfig = form.watch("hasStoneConfig");

  const selectedCategory = categories.find((c) => c.id === categoryId);
  const previewSku = selectedCategory ? generateSKU(selectedCategory.name, 1) : "";

  const purchasePricePerPiece = useMemo(() => {
    const weight = Number.parseFloat(weightGrams);
    const pricePerGram = Number.parseFloat(purchasePricePerGram);
    if (!Number.isFinite(weight) || !Number.isFinite(pricePerGram)) return 0;
    return Math.round(weight * pricePerGram * 100) / 100;
  }, [weightGrams, purchasePricePerGram]);

  const effectiveSilverRate = useEffectiveSilverRate();
  const fetchSilverRate = useSilverRateStore((s) => s.fetchRate);

  useEffect(() => {
    fetchSilverRate().finally(() => setRateLoading(false));
  }, [fetchSilverRate]);

  useEffect(() => {
    if (effectiveSilverRate > 0) {
      form.setValue("silverRateAtPurchase", String(effectiveSilverRate));
      const rate = useSilverRateStore.getState().rate;
      if (rate?.fetchedAt) {
        setRateDate(new Date(rate.fetchedAt).toLocaleDateString());
      }
    }
  }, [effectiveSilverRate, form]);

  useEffect(() => {
    fetch("/api/stones")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setStoneOptions(data.data);
        }
      })
      .finally(() => setStonesLoading(false));
  }, []);

  const handleSubmit = async (values: InventoryFormValues) => {
    const withStone = values.hasStoneConfig === "yes";

    await onSubmit({
      imageData: values.imageData,
      imageMimeType: values.imageMimeType,
      categoryId: values.categoryId,
      itemQuality: values.itemQuality,
      hasStoneConfig: withStone,
      stoneTypeId: withStone ? values.stoneTypeId || null : null,
      stoneColorId: withStone ? values.stoneColorId || null : null,
      stoneCutId: withStone ? values.stoneCutId || null : null,
      stoneClarityId: withStone ? values.stoneClarityId || null : null,
      stonePrice: withStone ? Number.parseFloat(values.stonePrice || "0") : null,
      weightGrams: Number.parseFloat(values.weightGrams),
      silverRateAtPurchase: Number.parseFloat(values.silverRateAtPurchase),
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
          name="itemQuality"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Item Quality *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PREMIUM">Premium</SelectItem>
                  <SelectItem value="LOCAL">Local</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasStoneConfig"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stone Configuration</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="no">No stone</SelectItem>
                  <SelectItem value="yes">Configure stone</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>Optional — leave as &quot;No stone&quot; for items without stones</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {hasStoneConfig === "yes" && (
          <div className="space-y-4 rounded-lg border p-4">
            <p className="text-sm font-medium">Stone details</p>
            {stonesLoading ? (
              <p className="text-sm text-muted-foreground">Loading stone options...</p>
            ) : (
              <>
                <FormField
                  control={form.control}
                  name="stoneTypeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stone Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stone type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stoneOptions.types.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
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
                  name="stoneColorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stone Color *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stone color" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stoneOptions.colors.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
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
                  name="stoneCutId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stone Cut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stone cut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stoneOptions.cuts.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
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
                  name="stoneClarityId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stone Clarity *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select stone clarity" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {stoneOptions.clarities.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
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
                  name="stonePrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stone Price (PKR) *</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" min="0" placeholder="e.g. 5000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {stoneOptions.types.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No stone options found.{" "}
                    <a href="/dashboard/stones" className="underline">
                      Add stone options
                    </a>{" "}
                    first.
                  </p>
                )}
              </>
            )}
          </div>
        )}

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
