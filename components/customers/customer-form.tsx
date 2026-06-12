"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const customerFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().optional(),
  email: z
    .string()
    .email("Invalid email")
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  defaultValues?: CustomerFormData;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function CustomerForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Customer",
  showCancel = false,
  onCancel,
}: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      phone: defaultValues?.phone || "",
      email: defaultValues?.email || "",
      address: defaultValues?.address || "",
    },
  });

  const handleSubmit = async (data: CustomerFormData) => {
    await onSubmit({
      name: data.name,
      phone: data.phone?.trim() || undefined,
      email: data.email?.trim() || undefined,
      address: data.address?.trim() || undefined,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="Customer name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone</FormLabel>
              <FormControl>
                <Input placeholder="e.g. 0300-1234567" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="email@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2">
          {showCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
