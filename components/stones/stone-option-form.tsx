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
import { Button } from "@/components/ui/button";

const stoneOptionFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
});

export type StoneOptionFormData = z.infer<typeof stoneOptionFormSchema>;

interface StoneOptionFormProps {
  defaultValues?: StoneOptionFormData;
  onSubmit: (data: StoneOptionFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function StoneOptionForm({
  defaultValues,
  onSubmit,
  isSubmitting = false,
  submitLabel = "Save",
}: StoneOptionFormProps) {
  const form = useForm<StoneOptionFormData>({
    resolver: zodResolver(stoneOptionFormSchema),
    defaultValues: {
      name: defaultValues?.name || "",
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
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Ruby, Round, Full Clear" {...field} />
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
