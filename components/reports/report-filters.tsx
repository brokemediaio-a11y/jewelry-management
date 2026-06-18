"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type ReportFilterValues = {
  period: string;
  from: string;
  to: string;
  beopariId?: string;
  karegarId?: string;
  expenseType?: string;
  customerId?: string;
  categoryId?: string;
};

export function ReportFilters({
  values,
  supportsDateRange,
  onChange,
  onApply,
}: {
  values: ReportFilterValues;
  supportsDateRange: boolean;
  onChange: (next: ReportFilterValues) => void;
  onApply: () => void;
}) {
  if (!supportsDateRange) {
    return (
      <p className="text-sm text-muted-foreground">
        This report shows a current snapshot and does not use a date range.
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-2">
        <Label>Period</Label>
        <Select
          value={values.period}
          onValueChange={(v) => onChange({ ...values, period: v })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="this-month">This month</SelectItem>
            <SelectItem value="last-month">Last month</SelectItem>
            <SelectItem value="this-quarter">This quarter</SelectItem>
            <SelectItem value="custom">Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {values.period === "custom" && (
        <>
          <div className="space-y-2">
            <Label>From</Label>
            <Input
              type="date"
              value={values.from}
              onChange={(e) => onChange({ ...values, from: e.target.value })}
              className="w-[160px]"
            />
          </div>
          <div className="space-y-2">
            <Label>To</Label>
            <Input
              type="date"
              value={values.to}
              onChange={(e) => onChange({ ...values, to: e.target.value })}
              className="w-[160px]"
            />
          </div>
        </>
      )}

      <Button type="button" onClick={onApply}>
        Apply
      </Button>
    </div>
  );
}

export function filtersToQuery(values: ReportFilterValues): string {
  const params = new URLSearchParams();
  params.set("period", values.period);
  if (values.period === "custom") {
    if (values.from) params.set("from", values.from);
    if (values.to) params.set("to", values.to);
  }
  if (values.beopariId) params.set("beopariId", values.beopariId);
  if (values.karegarId) params.set("karegarId", values.karegarId);
  if (values.expenseType) params.set("expenseType", values.expenseType);
  if (values.customerId) params.set("customerId", values.customerId);
  if (values.categoryId) params.set("categoryId", values.categoryId);
  return params.toString();
}

export function queryToFilters(searchParams: URLSearchParams): ReportFilterValues {
  return {
    period: searchParams.get("period") || "this-month",
    from: searchParams.get("from") || "",
    to: searchParams.get("to") || "",
    beopariId: searchParams.get("beopariId") || undefined,
    karegarId: searchParams.get("karegarId") || undefined,
    expenseType: searchParams.get("expenseType") || undefined,
    customerId: searchParams.get("customerId") || undefined,
    categoryId: searchParams.get("categoryId") || undefined,
  };
}
