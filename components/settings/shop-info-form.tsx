"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Store, Loader2 } from "lucide-react";

const shopInfoSchema = z.object({
  shopName: z.string().min(1, "Shop name is required"),
  shopAddress: z.string().optional(),
  shopPhone: z.string().optional(),
  shopEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  shopLogo: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ShopInfoFormData = z.infer<typeof shopInfoSchema>;

export function SettingsShopInfo() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<ShopInfoFormData>({
    resolver: zodResolver(shopInfoSchema),
    defaultValues: {
      shopName: "",
      shopAddress: "",
      shopPhone: "",
      shopEmail: "",
      shopLogo: "",
    },
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          form.reset({
            shopName: data.data.shop_name || "",
            shopAddress: data.data.shop_address || "",
            shopPhone: data.data.shop_phone || "",
            shopEmail: data.data.shop_email || "",
            shopLogo: data.data.shop_logo || "",
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load shop information");
        setLoading(false);
      });
  }, [form]);

  const onSubmit = async (data: ShopInfoFormData) => {
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settings: {
            shop_name: data.shopName,
            shop_address: data.shopAddress || "",
            shop_phone: data.shopPhone || "",
            shop_email: data.shopEmail || "",
            shop_logo: data.shopLogo || "",
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to update shop information");
      }
    } catch (err) {
      console.error("Error updating shop info:", err);
      setError("An error occurred while updating shop information");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Store className="h-5 w-5" />
          <CardTitle>Shop Information</CardTitle>
        </div>
        <CardDescription>
          Update shop details used in invoices and receipts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 border-success-border bg-success-muted">
            <AlertDescription className="text-[var(--success)]">
              Shop information updated successfully!
            </AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="shopName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shop Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., ABC Jewelry Shop" {...field} />
                  </FormControl>
                  <FormDescription>
                    Name displayed on invoices and receipts
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="shopAddress"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Shop address..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Complete shop address for invoices
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="shopPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +91 1234567890" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="shopEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="e.g., shop@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="shopLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Logo URL</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      placeholder="https://example.com/logo.png"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    URL to shop logo image (optional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {form.watch("shopLogo") && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Preview:</span>
                <img
                  src={form.watch("shopLogo")}
                  alt="Logo preview"
                  className="h-16 w-auto object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Information"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

