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

const categoryFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  description: z.string().optional(),
});

export type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface CategoryFormProps {
  defaultValues?: CategoryFormData;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function CategoryForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save Category",
}: CategoryFormProps) {
  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      description: defaultValues?.description || "",
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Real Premium Rings" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Optional description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
